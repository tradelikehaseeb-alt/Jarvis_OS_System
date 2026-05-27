/**
 * Runtime status for Hermes gateway boundary (Phase 43).
 */
export type HermesRuntimeStatus =
  | "stub"
  | "available"
  | "unavailable"
  | "degraded"
  | "unknown";
