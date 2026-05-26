import type { HermesAdapter } from "./hermes-adapter";
import {
  DEFAULT_HERMES_CONFIG,
  type HermesConfig,
} from "./hermes-config";
import type { HermesRequest } from "./hermes-request";
import type { HermesResponse } from "./hermes-response";

const STUB_PLAN_STEPS = ["stub-plan", "stub-review", "stub-execute-via-skills"] as const;

/**
 * Static Hermes adapter — mock planning/reasoning only (Phase 16).
 *
 * No LLM calls, no external repositories, no memory persistence.
 */
export class HermesAdapterStub implements HermesAdapter {
  readonly adapterId: string;

  constructor(private readonly defaultConfig: HermesConfig = DEFAULT_HERMES_CONFIG) {
    this.adapterId = defaultConfig.adapterId;
  }

  async invoke(
    request: HermesRequest,
    config: HermesConfig = this.defaultConfig,
  ): Promise<HermesResponse> {
    if (config.mode !== "stub") {
      return {
        success: false,
        adapterId: this.adapterId,
        stub: true,
        plan: {
          goal: "",
          steps: [],
          intentKind: request.intent.kind,
          summary: "",
        },
        reasoning: { summary: "", confidence: 0 },
        error: {
          code: "ADAPTER_NOT_CONFIGURED",
          message: "Official Hermes mode is not implemented; use stub mode",
        },
      };
    }

    const summary = `Stub plan for: ${request.intent.description}`;

    return {
      success: true,
      adapterId: this.adapterId,
      stub: true,
      plan: {
        goal: request.intent.description.trim() || summary,
        steps: [...STUB_PLAN_STEPS],
        intentKind: request.intent.kind,
        summary,
      },
      reasoning: {
        summary: `Stub reasoning (${request.intent.kind}) — skills handle execution`,
        confidence: 0.85,
      },
    };
  }
}

/** Factory for default stub adapter instance. */
export function createHermesAdapterStub(
  config: HermesConfig = DEFAULT_HERMES_CONFIG,
): HermesAdapterStub {
  return new HermesAdapterStub(config);
}
