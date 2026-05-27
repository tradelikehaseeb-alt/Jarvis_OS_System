import type { MemoryQuery } from "./memory-query";
import type { MemoryRecord } from "./memory-record";

/**
 * In-memory memory store contract (Phase 46).
 */
export interface MemoryStore {
  saveRecord(record: MemoryRecord): MemoryRecord;
  getRecord(recordId: string): MemoryRecord | undefined;
  queryHistory(query: MemoryQuery): readonly MemoryRecord[];
}
