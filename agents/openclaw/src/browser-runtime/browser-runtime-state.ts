/**
 * Browser runtime session lifecycle state (Phase 61).
 */
export type BrowserRuntimeState =
  | "idle"
  | "initializing"
  | "validated"
  | "executing"
  | "completed"
  | "failed"
  | "terminated";
