/**
 * API runtime health response (Phase 53).
 */
export interface ApiHealth {
  readonly status: "ok" | "degraded" | "down";
  readonly service: "jarvis-api-runtime";
  readonly orchestrator: "ok" | "degraded" | "down";
  readonly checkedAt: string;
}
