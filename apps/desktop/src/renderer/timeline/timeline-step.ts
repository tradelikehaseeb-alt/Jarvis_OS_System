/**
 * Desktop execution timeline step kinds (Phase 75).
 */
export type TimelineStepKind =
  | "planning_started"
  | "planning_completed"
  | "execution_started"
  | "action_progress"
  | "completed"
  | "failed";

export type TimelineStepStatus = "pending" | "active" | "complete" | "error";

/**
 * Single step in the execution timeline view.
 */
export interface TimelineStep {
  readonly id: string;
  readonly kind: TimelineStepKind;
  readonly label: string;
  readonly message?: string;
  readonly timestamp: string;
  readonly status: TimelineStepStatus;
}

export const TIMELINE_STEP_LABELS: Readonly<Record<TimelineStepKind, string>> = {
  planning_started: "Planning started",
  planning_completed: "Planning completed",
  execution_started: "Execution started",
  action_progress: "Action progress",
  completed: "Completed",
  failed: "Failed",
};

export const TIMELINE_STEP_ORDER: readonly TimelineStepKind[] = [
  "planning_started",
  "planning_completed",
  "execution_started",
  "action_progress",
  "completed",
  "failed",
];
