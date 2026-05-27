/**
 * OpenClaw runtime execution session lifecycle state (Phase 58).
 */
export type OpenClawExecutionState =
  | "idle"
  | "initializing"
  | "validated"
  | "executing"
  | "completed"
  | "failed"
  | "terminated";
