import type {
  MemoryQuery,
  MemoryRecord,
  MemorySearchResult,
  MemoryStoreInput,
  RetrievalRequest,
  RetrievalResponse,
} from "@jarvis/types";

import type { DefaultMemoryProvider } from "../memory-provider/default-memory-provider";
import type { DefaultRetrievalEngine } from "../retrieval-engine/default-retrieval-engine";
import type { MemoryCategory } from "../storage-adapter/sqlite-schema";
import {
  SqliteStorageAdapter,
  type ConversationRow,
  type UserFactRow,
} from "../storage-adapter/sqlite-storage-adapter";
import type { MemoryServiceComponents, MemoryApiService } from "./contract";

/**
 * Unified memory API — provider + retrieval + HTTP helpers.
 */
export class DefaultMemoryApiService implements MemoryApiService {
  readonly serviceId = "memory-service" as const;

  readonly provider: DefaultMemoryProvider;

  constructor(readonly components: MemoryServiceComponents) {
    this.provider = components.memoryProvider as DefaultMemoryProvider;
  }

  private get engine(): DefaultRetrievalEngine {
    return this.components.retrievalEngine as DefaultRetrievalEngine;
  }

  store(input: MemoryStoreInput): Promise<MemoryRecord> {
    return this.components.memoryProvider.store(input);
  }

  search(query: MemoryQuery): Promise<readonly MemorySearchResult[]> {
    return this.components.memoryProvider.search(query);
  }

  retrieve(request: RetrievalRequest): Promise<RetrievalResponse> {
    return this.components.retrievalEngine.retrieve(request);
  }

  saveMemoryContent(
    userId: string,
    content: string,
    category: MemoryCategory = "fact",
    importance = 0.5,
  ): Promise<MemoryRecord> {
    return this.provider.saveMemory(userId, content, category, importance);
  }

  searchMemories(
    userId: string,
    query: string,
    limit = 10,
  ): Promise<readonly MemorySearchResult[]> {
    return this.engine.searchMemories(userId, query, limit);
  }

  getRecentConversations(
    userId: string,
    limit = 10,
  ): Promise<readonly ConversationRow[]> {
    return this.engine.getRecentConversations(userId, limit);
  }

  getUserFact(userId: string, key: string): Promise<string | undefined> {
    return this.engine.getUserFact(userId, key);
  }

  listUserFacts(userId: string): Promise<readonly UserFactRow[]> {
    return this.sqliteStorage().listUserFacts(userId);
  }

  saveUserFact(
    userId: string,
    key: string,
    value: string,
  ): Promise<UserFactRow> {
    return this.sqliteStorage().saveUserFact(userId, key, value);
  }

  private sqliteStorage(): SqliteStorageAdapter {
    return this.components.storageAdapter as SqliteStorageAdapter;
  }

  deleteMemory(recordId: string, userId: string): Promise<boolean> {
    return this.provider.deleteMemory(recordId, userId);
  }
}
