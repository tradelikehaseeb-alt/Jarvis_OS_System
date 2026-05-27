import type { MemoryQuery } from "./memory-query";
import type { MemoryRecord } from "./memory-record";
import type { MemoryStore } from "./memory-store";
import { MEMORY_STORAGE_NAMESPACE } from "./memory-storage-namespace";
import type { StorageRecord } from "../storage-runtime/storage-record";
import type { StorageRuntime } from "../storage-runtime/storage-runtime";

function memoryToStorage(record: MemoryRecord): StorageRecord {
  return {
    id: record.recordId,
    namespace: MEMORY_STORAGE_NAMESPACE,
    timestamp: record.timestamp,
    data: { ...record },
    metadata: {
      type: record.type,
      userId: record.userId,
      taskId: record.taskId,
      sessionId: record.sessionId,
      conversationId: record.conversationId,
    },
  };
}

function storageToMemory(record: StorageRecord): MemoryRecord {
  const data = record.data as MemoryRecord;
  return {
    recordId: data.recordId ?? record.id,
    type: data.type,
    userId: data.userId,
    timestamp: data.timestamp ?? record.timestamp,
    taskId: data.taskId,
    sessionId: data.sessionId,
    conversationId: data.conversationId,
    content: data.content,
  };
}

function matchesMemoryQuery(record: MemoryRecord, query: MemoryQuery): boolean {
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

function buildStorageFilter(query: MemoryQuery): Record<string, unknown> {
  const filter: Record<string, unknown> = { userId: query.userId };
  if (query.taskId) {
    filter.taskId = query.taskId;
  }
  if (query.sessionId) {
    filter.sessionId = query.sessionId;
  }
  if (query.conversationId) {
    filter.conversationId = query.conversationId;
  }
  if (query.types?.length === 1) {
    filter.type = query.types[0];
  }
  return filter;
}

/**
 * {@link MemoryStore} backed by {@link StorageRuntime} (Phase 51).
 */
export class StorageBackedMemoryStore implements MemoryStore {
  constructor(private readonly runtime: StorageRuntime) {}

  saveRecord(record: MemoryRecord): MemoryRecord {
    this.runtime.save(memoryToStorage(record));
    return record;
  }

  getRecord(recordId: string): MemoryRecord | undefined {
    const stored = this.runtime.get(recordId, MEMORY_STORAGE_NAMESPACE);
    return stored ? storageToMemory(stored) : undefined;
  }

  queryHistory(query: MemoryQuery): readonly MemoryRecord[] {
    const stored = this.runtime.query({
      namespace: MEMORY_STORAGE_NAMESPACE,
      filter: buildStorageFilter(query),
      limit: query.limit,
    });

    return stored
      .map(storageToMemory)
      .filter((record) => matchesMemoryQuery(record, query))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }
}
