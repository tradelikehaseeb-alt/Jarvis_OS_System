import type { HermesAdapter } from "../../src/hermes-adapter";
import {
  DEFAULT_HERMES_CONFIG,
  type HermesConfig,
} from "../../src/hermes-config";
import type { HermesRequest } from "../../src/hermes-request";
import type { HermesResponse } from "../../src/hermes-response";

import {
  buildHermesStructuredPlan,
  toStructuredPlanJson,
} from "./hermes-structured-plan";

/** Default config for the official planning spike (Phase 22). */
export const DEFAULT_HERMES_PLANNING_CONFIG: HermesConfig = {
  adapterId: "hermes-planning-adapter",
  mode: "official",
} as const;

export interface HermesPlanningAdapterOptions {
  readonly defaultConfig?: HermesConfig;
}

/**
 * Official Hermes **planning-only** adapter (Phase 22).
 *
 * Implements {@link HermesAdapter} with deterministic structured plans from the task
 * description. Does not call external Hermes runtimes, LLMs, memory stores, or skills.
 *
 * Memory: Jarvis Memory Service APIs only (via orchestrator/agents — never owned here).
 */
export class HermesPlanningAdapter implements HermesAdapter {
  readonly adapterId: string;

  constructor(
    private readonly options: HermesPlanningAdapterOptions = {},
  ) {
    this.adapterId =
      options.defaultConfig?.adapterId ?? DEFAULT_HERMES_PLANNING_CONFIG.adapterId;
  }

  async invoke(
    request: HermesRequest,
    config: HermesConfig = this.options.defaultConfig ??
      DEFAULT_HERMES_PLANNING_CONFIG,
  ): Promise<HermesResponse> {
    if (config.mode === "stub") {
      return {
        success: false,
        adapterId: this.adapterId,
        stub: false,
        plan: {
          goal: "",
          steps: [],
          intentKind: request.intent.kind,
          summary: "",
        },
        reasoning: { summary: "", confidence: 0 },
        error: {
          code: "PLANNING_ADAPTER_MODE_MISMATCH",
          message:
            "HermesPlanningAdapter requires official mode; use HermesAdapterStub for stub mode",
        },
      };
    }

    const structured = buildHermesStructuredPlan(request);
    const planJson = toStructuredPlanJson(structured);

    return {
      success: true,
      adapterId: config.adapterId ?? this.adapterId,
      stub: false,
      plan: {
        ...planJson,
        intentKind: request.intent.kind,
        summary: planJson.goal,
      },
      reasoning: {
        summary: `Structured plan produced for intent "${request.intent.kind}" (planning only; skills execute via orchestrator)`,
        confidence: 0.9,
      },
    };
  }
}

/** Factory for {@link HermesAgent} wiring. */
export function createHermesPlanningAdapter(
  options?: HermesPlanningAdapterOptions,
): HermesPlanningAdapter {
  return new HermesPlanningAdapter(options);
}

/** Type guard for provider/bootstrap selection. */
export function isHermesPlanningAdapter(
  adapter: HermesAdapter,
): adapter is HermesPlanningAdapter {
  return adapter.adapterId === DEFAULT_HERMES_PLANNING_CONFIG.adapterId;
}
