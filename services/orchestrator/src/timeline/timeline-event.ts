/**
 * Execution timeline event kinds (Phase 75).
 */
export type TimelineEventKind =
  | "planning_started"
  | "planning_completed"
  | "execution_started"
  | "action_progress"
  | "completed"
  | "failed";

export type TimelineStepStatus = "pending" | "active" | "complete" | "error";

/**
 * Single execution timeline event for Desktop task progress view.
 */
export interface TimelineEvent {
  readonly id: string;
  readonly kind: TimelineEventKind;
  readonly label: string;
  readonly message?: string;
  readonly timestamp: string;
  readonly status: TimelineStepStatus;
  readonly timelineId: string;
  readonly taskId?: string;
}

export const TIMELINE_EVENT_LABELS: Readonly<Record<TimelineEventKind, string>> = {
  planning_started: "Planning started",
  planning_completed: "Planning completed",
  execution_started: "Execution started",
  action_progress: "Action progress",
  completed: "Completed",
  failed: "Failed",
};
