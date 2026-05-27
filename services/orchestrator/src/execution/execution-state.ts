/**
 * Execution lifecycle states (Phase 45).
 */
export type ExecutionState =
  | "queued"
  | "planning"
  | "executing"
  | "waiting"
  | "completed"
  | "failed"
  | "cancelled";
