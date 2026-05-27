/**
 * Real-time stream event types (Phase 47).
 */
export type StreamEventType =
  | "execution_started"
  | "planning_started"
  | "planning_completed"
  | "execution_completed"
  | "memory_saved"
  | "conversation_updated"
  | "failed";
