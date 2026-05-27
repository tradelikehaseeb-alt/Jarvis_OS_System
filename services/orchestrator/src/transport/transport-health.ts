/**
 * Health snapshot for a transport provider (Phase 52).
 */
export interface TransportHealth {
  readonly providerId: string;
  readonly status: "healthy" | "degraded" | "unavailable";
  readonly subscriberCount?: number;
  readonly activeSessionCount?: number;
  readonly messageCount?: number;
  readonly message?: string;
  readonly checkedAt: string;
}
