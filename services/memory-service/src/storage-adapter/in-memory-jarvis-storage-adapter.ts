import { randomUUID } from "node:crypto";

import type { MemoryRecord } from "@jarvis/types";

import {
  DEFAULT_USER_FACTS,
  type MemoryCategory,
} from "./sqlite-schema";
import type { JarvisPersistentStorage } from "./jarvis-persistent-storage";
import type {
  ConversationRow,
  MemoryRow,
  MemorySearchHit,
  UserFactRow,
} from "./memory-row-types";

function nowIso(): string {
  return new Date().toISOString();
}

function recencyScore(timestamp: string): number {
  const ageMs = Date.now() - new Date(timestamp).getTime();
  const days = Math.max(ageMs / (1000 * 60 * 60 * 24), 0.01);
  return 1 / days;
}

function parseCategory(value: string | undefined): MemoryCategory {
  if (
    value === "conversation" ||
    value === "fact" ||
    value === "task" ||
    value === "reminder"
  ) {
    return value;
  }
  return "fact";
}

/**
 * In-process Jarvis memory (Maps) — used for Electron and `JARVIS_MEMORY_BACKEND=local`.
 */
export class InMemoryJarvisStorageAdapter implements JarvisPersistentStorage {
  readonly componentId = "storage-adapter" as const;

  readonly databasePath = "memory://in-memory";

  private readonly memories = new Map<string, MemoryRow>();
  private readonly conversations = new Map<string, ConversationRow>();
  private readonly userFacts = new Map<string, UserFactRow>();

  constructor(
    options: {
      readonly seedUserId?: string;
    } = {},
  ) {
    const userId = options.seedUserId ?? "default";
    for (const [key, value] of Object.entries(DEFAULT_USER_FACTS)) {
      const factKey = `${userId}:${key}`;
      if (!this.userFacts.has(factKey)) {
        this.userFacts.set(factKey, {
          userId,
          key,
          value,
          updatedAt: nowIso(),
        });
      }
    }
  }

  private memoryKey(id: string, userId: string): string {
    return `${userId}:${id}`;
  }

  private factKey(userId: string, key: string): string {
    return `${userId}:${key}`;
  }

  async save(record: MemoryRecord): Promise<MemoryRecord> {
    const category = parseCategory(
      typeof record.metadata?.category === "string"
        ? record.metadata.category
        : typeof record.metadata?.type === "string"
          ? record.metadata.type
          : undefined,
    );
    const importance =
      typeof record.metadata?.importance === "number"
        ? record.metadata.importance
        : 0.5;

    await this.saveMemory({
      id: record.id,
      userId: record.userId,
      content: record.content,
      category,
      importance,
      timestamp: record.createdAt,
    });

    return record;
  }

  async load(recordId: string, userId: string): Promise<MemoryRecord | undefined> {
    const row = this.memories.get(this.memoryKey(recordId, userId));
    if (!row) {
      return undefined;
    }
    return {
      id: row.id,
      userId: row.userId,
      content: row.content,
      createdAt: row.timestamp,
      metadata: { category: row.category, importance: row.importance },
      embeddingRef: `emb-${row.id}`,
    };
  }

  async remove(recordId: string, userId: string): Promise<boolean> {
    return this.deleteMemory(recordId, userId);
  }

  async listByUserId(userId: string): Promise<readonly MemoryRecord[]> {
    const rows = await this.listMemories(userId);
    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      content: row.content,
      createdAt: row.timestamp,
      metadata: { category: row.category, importance: row.importance },
      embeddingRef: `emb-${row.id}`,
    }));
  }

  async saveMemory(input: {
    readonly id?: string;
    readonly userId: string;
    readonly content: string;
    readonly category: MemoryCategory;
    readonly importance?: number;
    readonly timestamp?: string;
  }): Promise<MemoryRow> {
    const id = input.id ?? randomUUID();
    const row: MemoryRow = {
      id,
      userId: input.userId,
      content: input.content,
      category: input.category,
      timestamp: input.timestamp ?? nowIso(),
      importance: input.importance ?? 0.5,
    };
    this.memories.set(this.memoryKey(id, input.userId), row);
    return row;
  }

  async listMemories(
    userId: string,
    category?: MemoryCategory,
    limit = 50,
  ): Promise<readonly MemoryRow[]> {
    const rows = [...this.memories.values()].filter((row) => {
      if (row.userId !== userId) {
        return false;
      }
      if (category && row.category !== category) {
        return false;
      }
      return true;
    });
    return rows
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
  }

  async deleteMemory(id: string, userId: string): Promise<boolean> {
    return this.memories.delete(this.memoryKey(id, userId));
  }

  async searchMemories(
    userId: string,
    query: string,
    limit = 10,
  ): Promise<readonly MemorySearchHit[]> {
    const trimmed = query.trim();
    const rows = await this.listMemories(userId, undefined, limit * 5);

    const hits: MemorySearchHit[] = [];
    if (trimmed.length === 0) {
      for (const memory of rows.slice(0, limit)) {
        hits.push({
          memory,
          score: memory.importance * 0.4 + recencyScore(memory.timestamp),
        });
      }
      return hits;
    }

    const lower = trimmed.toLowerCase();
    for (const memory of rows) {
      if (memory.content.toLowerCase().includes(lower)) {
        hits.push({
          memory,
          score: memory.importance * 0.3 + recencyScore(memory.timestamp),
        });
      }
    }

    return hits
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async saveConversation(input: {
    readonly id?: string;
    readonly userId: string;
    readonly role: string;
    readonly content: string;
    readonly taskId?: string;
    readonly timestamp?: string;
  }): Promise<ConversationRow> {
    const id = input.id ?? randomUUID();
    const timestamp = input.timestamp ?? nowIso();
    const row: ConversationRow = {
      id,
      userId: input.userId,
      role: input.role,
      content: input.content,
      taskId: input.taskId,
      timestamp,
    };
    this.conversations.set(id, row);
    await this.saveMemory({
      id: `conv-mem-${id}`,
      userId: input.userId,
      content: input.content,
      category: "conversation",
      timestamp,
      importance: 0.6,
    });
    return row;
  }

  async getRecentConversations(
    userId: string,
    limit = 10,
  ): Promise<readonly ConversationRow[]> {
    return [...this.conversations.values()]
      .filter((row) => row.userId === userId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
  }

  async getUserFact(userId: string, key: string): Promise<string | undefined> {
    return this.userFacts.get(this.factKey(userId, key))?.value;
  }

  async listUserFacts(userId: string): Promise<readonly UserFactRow[]> {
    return [...this.userFacts.values()]
      .filter((row) => row.userId === userId)
      .sort((a, b) => a.key.localeCompare(b.key));
  }

  async saveUserFact(
    userId: string,
    key: string,
    value: string,
  ): Promise<UserFactRow> {
    const updatedAt = nowIso();
    const row: UserFactRow = { userId, key, value, updatedAt };
    this.userFacts.set(this.factKey(userId, key), row);
    return row;
  }
}

export function createInMemoryJarvisStorageAdapter(
  options: ConstructorParameters<typeof InMemoryJarvisStorageAdapter>[0] = {},
): InMemoryJarvisStorageAdapter {
  return new InMemoryJarvisStorageAdapter(options);
}
