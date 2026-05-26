/**
 * Lifecycle status for an external runtime (Phase 20).
 */
export type RuntimeStatus =
  | "unknown"
  | "available"
  | "unavailable"
  | "degraded";

/** True when the runtime can accept work (available or degraded). */
export function isRuntimeReachable(status: RuntimeStatus): boolean {
  return status === "available" || status === "degraded";
}
