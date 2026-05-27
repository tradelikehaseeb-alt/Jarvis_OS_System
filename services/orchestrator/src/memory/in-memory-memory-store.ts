import type { MemoryQuery } from "./memory-query";
import type { MemoryRecord } from "./memory-record";
import type { MemoryStore } from "./memory-store";

function matchesQuery(record: MemoryRecord, query: MemoryQuery): boolean {
  if (record.userId !== query.userId) {
    return false;
  }
  if (query.types && !query.types.includes(record.type)) {
    return false;
  }
  if (query.taskId && record.taskId !== query.taskId) {
    return false;
  }
  if (query.sessionId && record.sessionId !== query.sessionId) {
    return false;
  }
  if (query.conversationId && record.conversationId !== query.conversationId) {
    return false;
  }
  return true;
}

/**
 * Deterministic in-memory memory store (Phase 46).
 */
export class InMemoryMemoryStore implements MemoryStore {
  private readonly records = new Map<string, MemoryRecord>();

  saveRecord(record: MemoryRecord): MemoryRecord {
    this.records.set(record.recordId, record);
    return record;
  }

  getRecord(recordId: string): MemoryRecord | undefined {
    return this.records.get(recordId);
  }

  queryHistory(query: MemoryQuery): readonly MemoryRecord[] {
    const results = [...this.records.values()]
      .filter((record) => matchesQuery(record, query))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    if (query.limit !== undefined) {
      return results.slice(-query.limit);
    }
    return results;
  }
}
