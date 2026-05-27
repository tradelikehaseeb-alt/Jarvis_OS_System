/**
 * Desktop activity timeline event kinds (Phase 48).
 * Aligned with orchestrator stream event types.
 */
export type ActivityEventKind =
  | "planning_started"
  | "planning_completed"
  | "execution_started"
  | "execution_completed"
  | "memory_saved"
  | "conversation_updated"
  | "failed";

export type ActivityEventStatus = "pending" | "active" | "complete" | "error";

/**
 * Single activity timeline entry for Desktop UI (Phase 48).
 */
export interface ActivityEvent {
  readonly id: string;
  readonly kind: ActivityEventKind;
  readonly label: string;
  readonly message?: string;
  readonly timestamp: string;
  readonly status: ActivityEventStatus;
}

export const ACTIVITY_EVENT_LABELS: Readonly<
  Record<ActivityEventKind, string>
> = {
  planning_started: "Planning started",
  planning_completed: "Planning completed",
  execution_started: "Execution started",
  execution_completed: "Execution completed",
  memory_saved: "Memory saved",
  conversation_updated: "Conversation updated",
  failed: "Error",
};
