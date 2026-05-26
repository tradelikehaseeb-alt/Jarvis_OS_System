import type { MemoryRecord } from "@jarvis/types";

/**
 * Low-level storage port — vector DB / SQL adapters in Phase 6+.
 */
export interface StorageAdapter {
  readonly componentId: "storage-adapter";
  save(record: MemoryRecord): Promise<MemoryRecord>;
  load(recordId: string, userId: string): Promise<MemoryRecord | undefined>;
  remove(recordId: string, userId: string): Promise<boolean>;
  /** List records for a user — stub/port helper (Phase 5). */
  listByUserId(userId: string): Promise<readonly MemoryRecord[]>;
}
