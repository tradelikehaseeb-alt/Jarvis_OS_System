/**
 * Lifecycle states for a managed Jarvis runtime process (Phase 55).
 */
export type RuntimeProcessState =
  | "stopped"
  | "starting"
  | "running"
  | "restarting"
  | "failed";
