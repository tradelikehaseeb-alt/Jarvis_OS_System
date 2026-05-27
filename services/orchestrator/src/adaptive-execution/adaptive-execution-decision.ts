import type { HermesExecutionPlan } from "@jarvis/hermes";

/** Outcome of {@link AdaptiveExecutionRuntime.evaluateExecution} (Phase 78). */
export type AdaptiveExecutionDecisionKind =
  | "continue"
  | "retry"
  | "modify_plan"
  | "abort"
  | "complete";

/**
 * Adaptive decision for the next execution action (Phase 78).
 */
export interface AdaptiveExecutionDecision {
  readonly kind: AdaptiveExecutionDecisionKind;
  readonly reason: string;
  readonly ruleId?: string;
  readonly retryCount?: number;
  readonly modifiedPlan?: HermesExecutionPlan;
}
