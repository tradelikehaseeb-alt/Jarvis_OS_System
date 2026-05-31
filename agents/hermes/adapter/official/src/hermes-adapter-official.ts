import type { HermesAdapter } from "../../src/hermes-adapter";
import type { HermesConfig } from "../../src/hermes-config";
import type { HermesRequest } from "../../src/hermes-request";
import type { HermesResponse } from "../../src/hermes-response";
import { buildHermesStructuredPlan, toStructuredPlanJson } from "./hermes-structured-plan";
import {
  readHermesRuntimeEnv,
  type EnvSource,
} from "./hermes-runtime-env";

export const HERMES_OFFICIAL_ADAPTER_ID = "hermes-adapter-official" as const;

const DEFAULT_PLAN_PATH = "/v1/jarvis/plan";
const DEFAULT_TIMEOUT_MS = 60_000;

export interface HermesAdapterOfficialOptions {
  readonly env?: EnvSource;
  readonly endpoint?: string;
  readonly planPath?: string;
  readonly timeoutMs?: number;
  readonly fetchFn?: typeof fetch;
}

interface OfficialPlanResponseBody {
  readonly goal?: string;
  readonly steps?: readonly string[];
  readonly summary?: string;
  readonly reasoning?: {
    readonly summary?: string;
    readonly confidence?: number;
  };
}

function emptyFailure(
  adapterId: string,
  intentKind: string,
  code: string,
  message: string,
): HermesResponse {
  return {
    success: false,
    adapterId,
    stub: false,
    plan: {
      goal: "",
      steps: [],
      intentKind,
      summary: "",
    },
    reasoning: { summary: "", confidence: 0 },
    error: { code, message },
  };
}

function mapOfficialBody(
  request: HermesRequest,
  body: OfficialPlanResponseBody,
  adapterId: string,
): HermesResponse {
  const steps = (body.steps ?? []).filter(
    (step): step is string => typeof step === "string" && step.trim().length > 0,
  );

  if (steps.length === 0) {
    const structured = buildHermesStructuredPlan(request);
    const planJson = toStructuredPlanJson(structured);
    return {
      success: true,
      adapterId,
      stub: false,
      plan: {
        ...planJson,
        intentKind: request.intent.kind,
        summary: planJson.goal,
      },
      reasoning: {
        summary:
          body.reasoning?.summary ??
          `Official Hermes endpoint returned no steps; used structured fallback for "${request.intent.kind}"`,
        confidence: body.reasoning?.confidence ?? 0.75,
      },
    };
  }

  const goal =
    typeof body.goal === "string" && body.goal.trim().length > 0
      ? body.goal.trim()
      : request.intent.description.trim();

  return {
    success: true,
    adapterId,
    stub: false,
    plan: {
      goal,
      steps,
      intentKind: request.intent.kind,
      summary: body.summary?.trim() || goal,
    },
    reasoning: {
      summary:
        body.reasoning?.summary ??
        `Official Hermes plan (${steps.length} steps)`,
      confidence:
        typeof body.reasoning?.confidence === "number"
          ? body.reasoning.confidence
          : 0.88,
    },
  };
}

/**
 * Official Nous Hermes runtime adapter — HTTP plan bridge (integration phase).
 *
 * Expects `POST {endpoint}/v1/jarvis/plan` with JSON body mirroring {@link HermesRequest}.
 */
export class HermesAdapterOfficial implements HermesAdapter {
  readonly adapterId: string;
  private readonly endpoint: string;
  private readonly planPath: string;
  private readonly timeoutMs: number;
  private readonly fetchFn: typeof fetch;

  constructor(options: HermesAdapterOfficialOptions = {}) {
    const env = readHermesRuntimeEnv(options.env);
    this.adapterId = HERMES_OFFICIAL_ADAPTER_ID;
    this.endpoint = (options.endpoint ?? env.endpoint).replace(/\/$/, "");
    this.planPath = options.planPath ?? DEFAULT_PLAN_PATH;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchFn = options.fetchFn ?? fetch;
  }

  async invoke(
    request: HermesRequest,
    config?: HermesConfig,
  ): Promise<HermesResponse> {
    if (config?.mode === "stub") {
      return emptyFailure(
        config.adapterId ?? this.adapterId,
        request.intent.kind,
        "OFFICIAL_ADAPTER_MODE_MISMATCH",
        "HermesAdapterOfficial requires official mode",
      );
    }

    if (!this.endpoint) {
      return emptyFailure(
        this.adapterId,
        request.intent.kind,
        "HERMES_ENDPOINT_MISSING",
        "Set HERMES_ENDPOINT for official Hermes mode",
      );
    }

    const url = `${this.endpoint}${this.planPath}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchFn(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          taskId: request.taskId,
          requestId: request.requestId,
          userId: request.userId,
          intent: request.intent,
          contextRef: request.contextRef,
          recalledContextSnippets: request.recalledContextSnippets,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        return emptyFailure(
          this.adapterId,
          request.intent.kind,
          "HERMES_OFFICIAL_HTTP_ERROR",
          `Hermes plan API ${response.status}: ${response.statusText}`,
        );
      }

      const body = (await response.json()) as OfficialPlanResponseBody;
      return mapOfficialBody(request, body, config?.adapterId ?? this.adapterId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Hermes official adapter failed";
      return emptyFailure(
        this.adapterId,
        request.intent.kind,
        "HERMES_OFFICIAL_UNAVAILABLE",
        message,
      );
    } finally {
      clearTimeout(timer);
    }
  }
}

export function createHermesAdapterOfficial(
  options?: HermesAdapterOfficialOptions,
): HermesAdapterOfficial {
  return new HermesAdapterOfficial(options);
}

export function isHermesAdapterOfficial(
  adapter: HermesAdapter,
): adapter is HermesAdapterOfficial {
  return adapter.adapterId === HERMES_OFFICIAL_ADAPTER_ID;
}
