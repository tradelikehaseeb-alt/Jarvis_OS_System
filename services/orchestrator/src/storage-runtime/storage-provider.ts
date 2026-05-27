import type { StorageHealth } from "./storage-health";
import type { StorageQuery } from "./storage-query";
import type { StorageRecord } from "./storage-record";

/**
 * Pluggable storage backend contract (Phase 51).
 */
export interface StorageProvider {
  readonly providerId: string;
  save(record: StorageRecord): StorageRecord;
  get(id: string, namespace: string): StorageRecord | undefined;
  query(query: StorageQuery): readonly StorageRecord[];
  delete(id: string, namespace: string): boolean;
  getHealth(): StorageHealth;
}
