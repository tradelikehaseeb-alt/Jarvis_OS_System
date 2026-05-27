/**
 * Provider connection health snapshot (Phase 60).
 */
export interface ProviderHealth {
  readonly providerId: string;
  readonly family: "hermes" | "openclaw";
  readonly status: "healthy" | "degraded" | "unavailable";
  readonly connected: boolean;
  readonly stub: boolean;
  readonly message: string;
  readonly checkedAt: string;
}
