/**
 * Adaptive execution lifecycle event kinds (Phase 78).
 */
export type AdaptiveExecutionEventKind =
  | "evaluation_started"
  | "decision_made"
  | "retry_started"
  | "plan_modified"
  | "step_selected"
  | "execution_completed"
  | "execution_failed";

/**
 * Event emitted during adaptive task chain execution (Phase 78).
 */
export interface AdaptiveExecutionEvent {
  readonly eventId: string;
  readonly executionId: string;
  readonly kind: AdaptiveExecutionEventKind;
  readonly stepIndex?: number;
  readonly stepId?: string;
  readonly message?: string;
  readonly timestamp: string;
  readonly stub?: boolean;
  readonly decisionKind?: string;
}

export const ADAPTIVE_EXECUTION_EVENT_LABELS: Readonly<
  Record<AdaptiveExecutionEventKind, string>
> = {
  evaluation_started: "Adaptive evaluation started",
  decision_made: "Adaptive decision made",
  retry_started: "Adaptive retry started",
  plan_modified: "Execution plan modified",
  step_selected: "Next step selected",
  execution_completed: "Adaptive execution completed",
  execution_failed: "Adaptive execution failed",
};
