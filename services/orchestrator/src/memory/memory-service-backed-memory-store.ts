import { createMemoryService, type MemoryApiService } from "@jarvis/memory-service";

import type { MemoryQuery } from "./memory-query";
import type { MemoryRecord } from "./memory-record";
import type { MemoryStore } from "./memory-store";
import type { MemoryType } from "./memory-type";

function memoryTypeFromMetadata(
  metadata?: Readonly<Record<string, unknown>>,
): MemoryType {
  const raw = metadata?.type;
  if (
    raw === "conversation" ||
    raw === "execution" ||
    raw === "activity" ||
    raw === "summary"
  ) {
    return raw;
  }
  return "activity";
}

/**
 * {@link MemoryStore} delegating persistence to {@link MemoryApiService} (Jarvis Memory Service).
 */
export class MemoryServiceBackedMemoryStore implements MemoryStore {
  private readonly cache = new Map<string, MemoryRecord>();

  constructor(
    private readonly api: MemoryApiService = createMemoryService({
      env: process.env,
    }),
  ) {}

  saveRecord(record: MemoryRecord): MemoryRecord {
    this.cache.set(record.recordId, record);
    void this.api.store({
      userId: record.userId,
      content: JSON.stringify(record.content),
      metadata: {
        type: record.type,
        recordId: record.recordId,
        taskId: record.taskId,
        sessionId: record.sessionId,
        conversationId: record.conversationId,
        timestamp: record.timestamp,
      },
    });
    return record;
  }

  getRecord(recordId: string): MemoryRecord | undefined {
    return this.cache.get(recordId);
  }

  queryHistory(query: MemoryQuery): readonly MemoryRecord[] {
    const cached = [...this.cache.values()].filter((record) => {
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
    });

    const limit = query.limit ?? cached.length;
    return cached.slice(-limit);
  }
}

export function mapApiSearchToMemoryRecord(
  result: { readonly record: { readonly id: string; readonly userId: string; readonly content: string; readonly createdAt: string; readonly metadata?: Readonly<Record<string, unknown>> } },
): MemoryRecord {
  let content: Readonly<Record<string, unknown>> = { text: result.record.content };
  try {
    const parsed = JSON.parse(result.record.content) as unknown;
    if (parsed && typeof parsed === "object") {
      content = parsed as Readonly<Record<string, unknown>>;
    }
  } catch {
    // keep text wrapper
  }

  return {
    recordId: String(result.record.metadata?.recordId ?? result.record.id),
    type: memoryTypeFromMetadata(result.record.metadata),
    userId: result.record.userId,
    timestamp: String(result.record.metadata?.timestamp ?? result.record.createdAt),
    taskId:
      typeof result.record.metadata?.taskId === "string"
        ? result.record.metadata.taskId
        : undefined,
    sessionId:
      typeof result.record.metadata?.sessionId === "string"
        ? result.record.metadata.sessionId
        : undefined,
    conversationId:
      typeof result.record.metadata?.conversationId === "string"
        ? result.record.metadata.conversationId
        : undefined,
    content,
  };
}
