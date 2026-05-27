/**
 * Health snapshot for a storage provider (Phase 51).
 */
export interface StorageHealth {
  readonly providerId: string;
  readonly status: "healthy" | "degraded" | "unavailable";
  readonly recordCount?: number;
  readonly message?: string;
  readonly checkedAt: string;
}
