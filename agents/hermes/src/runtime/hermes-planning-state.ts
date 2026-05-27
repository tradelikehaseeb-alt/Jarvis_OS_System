/**
 * Hermes runtime planning session lifecycle state (Phase 59).
 */
export type HermesPlanningState =
  | "idle"
  | "initializing"
  | "validated"
  | "planning"
  | "completed"
  | "failed"
  | "terminated";
