/**
 * Generic persisted record for the orchestrator storage runtime (Phase 51).
 */
export interface StorageRecord {
  readonly id: string;
  readonly namespace: string;
  readonly timestamp: string;
  readonly data: Readonly<Record<string, unknown>>;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
