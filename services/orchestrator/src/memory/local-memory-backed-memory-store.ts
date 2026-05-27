import type {
  LocalMemoryQuery,
  LocalMemoryRecord,
  LocalMemoryRuntime,
} from "@jarvis/local-memory";
import { LOCAL_MEMORY_SCHEMA_VERSION } from "@jarvis/local-memory";

import type { MemoryQuery } from "./memory-query";
import type { MemoryRecord } from "./memory-record";
import type { MemoryStore } from "./memory-store";

function memoryToLocal(record: MemoryRecord): LocalMemoryRecord {
  return {
    ...record,
    schemaVersion: LOCAL_MEMORY_SCHEMA_VERSION,
  };
}

function localToMemory(record: LocalMemoryRecord): MemoryRecord {
  const { schemaVersion: _schemaVersion, ...memory } = record;
  return memory;
}

function toLocalQuery(query: MemoryQuery): LocalMemoryQuery {
  return {
    userId: query.userId,
    types: query.types,
    taskId: query.taskId,
    sessionId: query.sessionId,
    conversationId: query.conversationId,
    limit: query.limit,
  };
}

/**
 * {@link MemoryStore} backed by {@link LocalMemoryRuntime} (Phase 62).
 */
export class LocalMemoryBackedMemoryStore implements MemoryStore {
  constructor(private readonly runtime: LocalMemoryRuntime) {}

  saveRecord(record: MemoryRecord): MemoryRecord {
    this.runtime.saveMemory(memoryToLocal(record));
    return record;
  }

  getRecord(recordId: string): MemoryRecord | undefined {
    const stored = this.runtime.getMemory(recordId);
    return stored ? localToMemory(stored) : undefined;
  }

  queryHistory(query: MemoryQuery): readonly MemoryRecord[] {
    return this.runtime.queryMemory(toLocalQuery(query)).map(localToMemory);
  }

  deleteRecord(recordId: string): boolean {
    return this.runtime.deleteMemory(recordId);
  }

  getHealth() {
    return this.runtime.getHealth();
  }
}
