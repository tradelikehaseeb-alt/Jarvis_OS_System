/**
 * Runtime status for OpenClaw gateway boundary (Phase 42).
 */
export type OpenClawRuntimeStatus =
  | "stub"
  | "available"
  | "unavailable"
  | "degraded"
  | "unknown";
