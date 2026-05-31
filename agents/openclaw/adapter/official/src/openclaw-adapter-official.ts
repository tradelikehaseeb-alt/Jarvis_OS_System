import type { OpenClawAdapter } from "../../src/openclaw-adapter";
import type { OpenClawConfig } from "../../src/openclaw-config";
import type { OpenClawRequest } from "../../src/openclaw-request";
import type { OpenClawResponse } from "../../src/openclaw-response";
import {
  readOpenClawRuntimeEnv,
  type EnvSource,
} from "./openclaw-runtime-env";

export const OPENCLAW_OFFICIAL_ADAPTER_ID = "openclaw-adapter-official" as const;

const DEFAULT_INVOKE_PATH = "/tools/invoke";
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_INVOKE_ATTEMPTS = 2;

export interface OpenClawAdapterOfficialOptions {
  readonly env?: EnvSource;
  readonly endpoint?: string;
  readonly invokePath?: string;
  readonly timeoutMs?: number;
  readonly fetchFn?: typeof fetch;
  readonly maxAttempts?: number;
}

interface GatewayInvokeBody {
  readonly success?: boolean;
  readonly handleId?: string;
  readonly approvedActions?: readonly string[];
  readonly browser?: Readonly<Record<string, unknown>>;
  readonly message?: string;
  readonly error?: { readonly code?: string; readonly message?: string };
}

interface GatewayInvokePayload {
  readonly tool: string;
  readonly action: string;
  readonly taskId: string;
  readonly requestId: string;
  readonly userId: string;
  readonly intent: OpenClawRequest["intent"];
  readonly requestedActions: readonly string[];
  readonly contextRef?: string;
}

export interface ClassifiedGatewayError {
  readonly code: string;
  readonly message: string;
  readonly retryable: boolean;
}

function readGatewayToken(env: EnvSource): string | undefined {
  return (
    env.OPENCLAW_GATEWAY_TOKEN?.trim() ||
    env.OPENCLAW_GATEWAY_AUTH_TOKEN?.trim() ||
    undefined
  );
}

function buildRejected(
  adapterId: string,
  request: OpenClawRequest,
  code: string,
  message: string,
): OpenClawResponse {
  return {
    success: false,
    adapterId,
    stub: false,
    execution: {
      status: "rejected",
      sandbox: true,
      permissionsChecked: true,
      handleId: `handle-${request.taskId}`,
    },
    approvedActions: [],
    error: { code, message },
  };
}

function isRetryableHttpStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

/**
 * Classify fetch/network failures for user-facing gateway errors.
 */
export function classifyOpenClawGatewayError(
  error: unknown,
  endpoint: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): ClassifiedGatewayError {
  if (error instanceof Error && error.name === "AbortError") {
    return {
      code: "OPENCLAW_GATEWAY_TIMEOUT",
      message: `OpenClaw gateway at ${endpoint} did not respond within ${timeoutMs / 1000}s`,
      retryable: true,
    };
  }

  const message =
    error instanceof Error ? error.message : String(error ?? "Unknown error");
  const lower = message.toLowerCase();

  if (
    lower.includes("econnrefused") ||
    lower.includes("econnreset") ||
    lower.includes("enotfound") ||
    lower.includes("fetch failed") ||
    lower.includes("network") ||
    lower.includes("socket")
  ) {
    return {
      code: "OPENCLAW_GATEWAY_DOWN",
      message: [
        `OpenClaw gateway is not reachable at ${endpoint}.`,
        "Start the gateway on port 18789 (see docs/RUNTIME_SETUP.md)",
        "or set OPENCLAW_MODE=local to use Jarvis Playwright instead.",
        `Underlying error: ${message}`,
      ].join(" "),
      retryable: true,
    };
  }

  return {
    code: "OPENCLAW_GATEWAY_UNAVAILABLE",
    message: message,
    retryable: true,
  };
}

function mapGatewayBody(
  request: OpenClawRequest,
  body: GatewayInvokeBody,
  adapterId: string,
  actions: readonly string[],
  config?: OpenClawConfig,
): OpenClawResponse {
  if (body.success === false) {
    return buildRejected(
      adapterId,
      request,
      body.error?.code ?? "OPENCLAW_GATEWAY_REJECTED",
      body.error?.message ?? body.message ?? "Gateway rejected execution",
    );
  }

  const handleId = body.handleId ?? `handle-official-${request.taskId}`;
  const approved =
    body.approvedActions && body.approvedActions.length > 0
      ? body.approvedActions
      : actions;

  return {
    success: true,
    adapterId: config?.adapterId ?? adapterId,
    stub: false,
    execution: {
      status: "accepted",
      sandbox: config?.sandboxRequired ?? true,
      permissionsChecked: true,
      handleId,
    },
    approvedActions: approved,
    gatewayPayload: {
      browserRuntime: body.browser,
      message: body.message,
    },
  };
}

/**
 * Official OpenClaw gateway adapter — HTTP POST `/tools/invoke` with retry.
 */
export class OpenClawAdapterOfficial implements OpenClawAdapter {
  readonly adapterId: string;
  private readonly endpoint: string;
  private readonly invokePath: string;
  private readonly timeoutMs: number;
  private readonly fetchFn: typeof fetch;
  private readonly env: EnvSource;
  private readonly maxAttempts: number;

  constructor(options: OpenClawAdapterOfficialOptions = {}) {
    this.env = options.env ?? process.env;
    const runtimeEnv = readOpenClawRuntimeEnv(this.env);
    this.adapterId = OPENCLAW_OFFICIAL_ADAPTER_ID;
    this.endpoint = (options.endpoint ?? runtimeEnv.endpoint).replace(/\/$/, "");
    this.invokePath = options.invokePath ?? DEFAULT_INVOKE_PATH;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchFn = options.fetchFn ?? fetch;
    this.maxAttempts = options.maxAttempts ?? MAX_INVOKE_ATTEMPTS;
  }

  async invoke(
    request: OpenClawRequest,
    config?: OpenClawConfig,
  ): Promise<OpenClawResponse> {
    if (config?.mode === "stub") {
      return buildRejected(
        config.adapterId ?? this.adapterId,
        request,
        "OFFICIAL_ADAPTER_MODE_MISMATCH",
        "OpenClawAdapterOfficial requires official mode",
      );
    }

    if (!this.endpoint) {
      return buildRejected(
        this.adapterId,
        request,
        "OPENCLAW_ENDPOINT_MISSING",
        "Set OPENCLAW_ENDPOINT or OPENCLAW_GATEWAY_URL for official OpenClaw mode",
      );
    }

    const token = readGatewayToken(this.env);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const actions = request.requestedActions ?? ["browser", "file"];
    const url = `${this.endpoint}${this.invokePath}`;
    const payload: GatewayInvokePayload = {
      tool: "browser",
      action: "execute-intent",
      taskId: request.taskId,
      requestId: request.requestId,
      userId: request.userId,
      intent: request.intent,
      requestedActions: actions,
      contextRef: request.contextRef,
    };

    let lastError: ClassifiedGatewayError | undefined;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await this.fetchFn(url, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (!response.ok) {
          const httpMessage = `OpenClaw gateway ${response.status}: ${response.statusText} (${url})`;
          if (
            attempt < this.maxAttempts &&
            isRetryableHttpStatus(response.status)
          ) {
            lastError = {
              code: "OPENCLAW_GATEWAY_HTTP_ERROR",
              message: httpMessage,
              retryable: true,
            };
            continue;
          }
          return buildRejected(
            this.adapterId,
            request,
            "OPENCLAW_GATEWAY_HTTP_ERROR",
            httpMessage,
          );
        }

        const body = (await response.json()) as GatewayInvokeBody;
        return mapGatewayBody(
          request,
          body,
          config?.adapterId ?? this.adapterId,
          actions,
          config,
        );
      } catch (error) {
        clearTimeout(timer);
        const classified = classifyOpenClawGatewayError(
          error,
          this.endpoint,
          this.timeoutMs,
        );
        lastError = classified;
        if (attempt < this.maxAttempts && classified.retryable) {
          continue;
        }
        return buildRejected(
          this.adapterId,
          request,
          classified.code,
          classified.message,
        );
      }
    }

    return buildRejected(
      this.adapterId,
      request,
      lastError?.code ?? "OPENCLAW_GATEWAY_UNAVAILABLE",
      lastError?.message ?? "OpenClaw gateway invoke failed after retries",
    );
  }
}

export function createOpenClawAdapterOfficial(
  options?: OpenClawAdapterOfficialOptions,
): OpenClawAdapterOfficial {
  return new OpenClawAdapterOfficial(options);
}

export function isOpenClawAdapterOfficial(
  adapter: OpenClawAdapter,
): adapter is OpenClawAdapterOfficial {
  return adapter.adapterId === OPENCLAW_OFFICIAL_ADAPTER_ID;
}

export function shouldUseOfficialOpenClawAdapter(
  env: EnvSource = process.env,
): boolean {
  if (env.NODE_ENV === "test" && env.OPENCLAW_INTEGRATION_LIVE !== "true") {
    return false;
  }
  const runtimeEnv = readOpenClawRuntimeEnv(env);
  return runtimeEnv.mode === "official" || runtimeEnv.mode === "remote";
}
