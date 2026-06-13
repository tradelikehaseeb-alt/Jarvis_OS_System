import type { MemorySearchResult } from "@jarvis/types";

import { createMemoryService, type CreateMemoryServiceOptions } from "./create-memory-service";
import type { DefaultMemoryApiService } from "./memory-api/default-memory-api-service";
import type { ConversationRow } from "./storage-adapter/memory-row-types";
import { isJarvisPersistentStorage } from "./storage-adapter/jarvis-persistent-storage";

/**
 * In-process client for orchestrator context loading (SQLite-backed).
 */
export class JarvisMemoryClient {
  private readonly service: DefaultMemoryApiService;

  constructor(options: CreateMemoryServiceOptions = {}) {
    const api = createMemoryService(options);
    this.service = api as DefaultMemoryApiService;
  }

  get databasePath(): string {
    const storage = this.service.components.storageAdapter;
    if (isJarvisPersistentStorage(storage)) {
      return storage.databasePath;
    }
    return "";
  }

  getUserFact(userId: string, key: string): Promise<string | undefined> {
    return this.service.getUserFact(userId, key);
  }

  getRecentConversations(
    userId: string,
    limit = 10,
  ): Promise<readonly ConversationRow[]> {
    return this.service.getRecentConversations(userId, limit);
  }

  searchMemories(
    userId: string,
    query: string,
    limit = 10,
  ): Promise<readonly MemorySearchResult[]> {
    return this.service.searchMemories(userId, query, limit);
  }

  saveConversation(input: {
    readonly userId: string;
    readonly role: string;
    readonly content: string;
    readonly taskId?: string;
  }): Promise<void> {
    const storage = this.service.components.storageAdapter;
    if (!isJarvisPersistentStorage(storage)) {
      return Promise.resolve();
    }
    return storage.saveConversation(input).then(() => undefined);
  }
}

let sharedClient: JarvisMemoryClient | undefined;

/** Shared SQLite memory client for orchestrator integration. */
export function getSharedJarvisMemoryClient(
  options?: CreateMemoryServiceOptions,
): JarvisMemoryClient {
  if (!sharedClient) {
    sharedClient = new JarvisMemoryClient(options);
  }
  return sharedClient;
}

export function resetSharedJarvisMemoryClient(): void {
  sharedClient = undefined;
}
