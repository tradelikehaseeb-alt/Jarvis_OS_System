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
const DEFAULT_TIMEOUT_MS = 90_000;

export interface OpenClawAdapterOfficialOptions {
  readonly env?: EnvSource;
  readonly endpoint?: string;
  readonly invokePath?: string;
  readonly timeoutMs?: number;
  readonly fetchFn?: typeof fetch;
}

interface GatewayInvokeBody {
  readonly success?: boolean;
  readonly handleId?: string;
  readonly approvedActions?: readonly string[];
  readonly browser?: Readonly<Record<string, unknown>>;
  readonly message?: string;
  readonly error?: { readonly code?: string; readonly message?: string };
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

/**
 * Official OpenClaw gateway adapter — HTTP tool invoke bridge.
 */
export class OpenClawAdapterOfficial implements OpenClawAdapter {
  readonly adapterId: string;
  private readonly endpoint: string;
  private readonly invokePath: string;
  private readonly timeoutMs: number;
  private readonly fetchFn: typeof fetch;
  private readonly env: EnvSource;

  constructor(options: OpenClawAdapterOfficialOptions = {}) {
    this.env = options.env ?? process.env;
    const runtimeEnv = readOpenClawRuntimeEnv(this.env);
    this.adapterId = OPENCLAW_OFFICIAL_ADAPTER_ID;
    this.endpoint = (options.endpoint ?? runtimeEnv.endpoint).replace(/\/$/, "");
    this.invokePath = options.invokePath ?? DEFAULT_INVOKE_PATH;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchFn = options.fetchFn ?? fetch;
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
        "Set OPENCLAW_ENDPOINT for official OpenClaw mode",
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
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchFn(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          tool: "browser",
          action: "execute-intent",
          taskId: request.taskId,
          requestId: request.requestId,
          userId: request.userId,
          intent: request.intent,
          requestedActions: actions,
          contextRef: request.contextRef,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        return buildRejected(
          this.adapterId,
          request,
          "OPENCLAW_GATEWAY_HTTP_ERROR",
          `OpenClaw gateway ${response.status}: ${response.statusText}`,
        );
      }

      const body = (await response.json()) as GatewayInvokeBody;
      const handleId =
        body.handleId ?? `handle-official-${request.taskId}`;
      const approved =
        body.approvedActions && body.approvedActions.length > 0
          ? body.approvedActions
          : actions;

      if (body.success === false) {
        return buildRejected(
          this.adapterId,
          request,
          body.error?.code ?? "OPENCLAW_GATEWAY_REJECTED",
          body.error?.message ?? body.message ?? "Gateway rejected execution",
        );
      }

      return {
        success: true,
        adapterId: config?.adapterId ?? this.adapterId,
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
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "OpenClaw official adapter failed";
      return buildRejected(
        this.adapterId,
        request,
        "OPENCLAW_GATEWAY_UNAVAILABLE",
        message,
      );
    } finally {
      clearTimeout(timer);
    }
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
