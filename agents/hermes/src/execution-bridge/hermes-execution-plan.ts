import type { HermesExecutionStep } from "./hermes-execution-step";

/** Source of the execution plan materialization. */
export type HermesExecutionPlanSource =
  | "structured_plan"
  | "agent_payload"
  | "stub_fallback";

/**
 * Hermes plan mapped to an OpenClaw-executable chain (Phase 77).
 */
export interface HermesExecutionPlan {
  readonly planId: string;
  readonly goal: string;
  readonly steps: readonly HermesExecutionStep[];
  readonly stub: boolean;
  readonly source: HermesExecutionPlanSource;
}
