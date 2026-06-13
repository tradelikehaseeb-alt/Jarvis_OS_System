import type { MemoryRecord } from "@jarvis/types";

import type { StorageAdapter } from "./contract";
import type { MemoryCategory } from "./sqlite-schema";
import type {
  ConversationRow,
  MemoryRow,
  MemorySearchHit,
  UserFactRow,
} from "./memory-row-types";

/**
 * Full Jarvis memory port (SQLite or in-memory) — no native bindings required.
 */
export interface JarvisPersistentStorage extends StorageAdapter {
  readonly databasePath: string;
  saveMemory(input: {
    readonly id?: string;
    readonly userId: string;
    readonly content: string;
    readonly category: MemoryCategory;
    readonly importance?: number;
    readonly timestamp?: string;
  }): Promise<MemoryRow>;
  searchMemories(
    userId: string,
    query: string,
    limit?: number,
  ): Promise<readonly MemorySearchHit[]>;
  listMemories(
    userId: string,
    category?: MemoryCategory,
    limit?: number,
  ): Promise<readonly MemoryRow[]>;
  saveConversation(input: {
    readonly id?: string;
    readonly userId: string;
    readonly role: string;
    readonly content: string;
    readonly taskId?: string;
    readonly timestamp?: string;
  }): Promise<ConversationRow>;
  getRecentConversations(
    userId: string,
    limit?: number,
  ): Promise<readonly ConversationRow[]>;
  getUserFact(userId: string, key: string): Promise<string | undefined>;
  listUserFacts(userId: string): Promise<readonly UserFactRow[]>;
  saveUserFact(
    userId: string,
    key: string,
    value: string,
  ): Promise<UserFactRow>;
  deleteMemory(id: string, userId: string): Promise<boolean>;
  save(record: MemoryRecord): Promise<MemoryRecord>;
}

export function isJarvisPersistentStorage(
  storage: StorageAdapter,
): storage is JarvisPersistentStorage {
  return (
    typeof (storage as JarvisPersistentStorage).searchMemories === "function" &&
    typeof (storage as JarvisPersistentStorage).getRecentConversations ===
      "function"
  );
}
