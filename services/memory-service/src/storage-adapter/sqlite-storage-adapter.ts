import fs from "node:fs";
import { randomUUID } from "node:crypto";

import type { Database as SqliteDatabase } from "better-sqlite3";
import Database from "better-sqlite3";
import type { MemoryRecord } from "@jarvis/types";

import type { StorageAdapter } from "./contract";
import { ensureMemoryDirectory, resolveDatabasePath } from "./memory-path";
import {
  DEFAULT_USER_FACTS,
  type MemoryCategory,
  SQLITE_SCHEMA_SQL,
} from "./sqlite-schema";

export interface MemoryRow {
  readonly id: string;
  readonly userId: string;
  readonly content: string;
  readonly category: MemoryCategory;
  readonly timestamp: string;
  readonly importance: number;
}

export interface ConversationRow {
  readonly id: string;
  readonly userId: string;
  readonly role: string;
  readonly content: string;
  readonly taskId?: string;
  readonly timestamp: string;
}

export interface UserFactRow {
  readonly userId: string;
  readonly key: string;
  readonly value: string;
  readonly updatedAt: string;
}

export interface MemorySearchHit {
  readonly memory: MemoryRow;
  readonly score: number;
}

const BACKUP_EVERY_N_WRITES = 100;

function nowIso(): string {
  return new Date().toISOString();
}

function escapeFtsQuery(query: string): string {
  return query
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0)
    .map((token) => `"${token.replace(/"/g, '""')}"`)
    .join(" ");
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
 * SQLite-backed storage — durable memory at `jarvis.db` under {@link resolveDatabasePath}.
 */
export class SqliteStorageAdapter implements StorageAdapter {
  readonly componentId = "storage-adapter" as const;

  private readonly db: SqliteDatabase;
  private writeCount = 0;

  constructor(
    options: {
      readonly dbPath?: string;
      readonly env?: Readonly<Record<string, string | undefined>>;
      readonly seedUserId?: string;
    } = {},
  ) {
    const dbPath =
      options.dbPath ??
      resolveDatabasePath(options.env ?? process.env);
    ensureMemoryDirectory(options.env ?? process.env);
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.exec(SQLITE_SCHEMA_SQL);
    this.seedDefaultUserFacts(options.seedUserId ?? "default");
  }

  get databasePath(): string {
    return this.db.name;
  }

  private seedDefaultUserFacts(userId: string): void {
    const upsert = this.db.prepare(`
      INSERT INTO user_facts (user_id, key, value, updated_at)
      VALUES (@userId, @key, @value, @updatedAt)
      ON CONFLICT(user_id, key) DO NOTHING
    `);

    const seed = this.db.transaction(() => {
      for (const [key, value] of Object.entries(DEFAULT_USER_FACTS)) {
        upsert.run({
          userId,
          key,
          value,
          updatedAt: nowIso(),
        });
      }
    });
    seed();
  }

  private trackWrite(): void {
    this.writeCount += 1;
    if (this.writeCount % BACKUP_EVERY_N_WRITES === 0) {
      this.backupDatabase();
    }
  }

  /** Copies database to `.bak` alongside the db file. */
  backupDatabase(): void {
    const source = this.db.name;
    const backupPath = `${source}.bak`;
    fs.copyFileSync(source, backupPath);
  }

  close(): void {
    this.db.close();
  }

  // --- StorageAdapter (MemoryRecord port) ---

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
    const row = await this.getMemory(recordId, userId);
    if (!row) {
      return undefined;
    }
    return this.rowToMemoryRecord(row);
  }

  async remove(recordId: string, userId: string): Promise<boolean> {
    return this.deleteMemory(recordId, userId);
  }

  async listByUserId(userId: string): Promise<readonly MemoryRecord[]> {
    const rows = await this.listMemories(userId);
    return rows.map((row) => this.rowToMemoryRecord(row));
  }

  private rowToMemoryRecord(row: MemoryRow): MemoryRecord {
    return {
      id: row.id,
      userId: row.userId,
      content: row.content,
      createdAt: row.timestamp,
      metadata: {
        category: row.category,
        importance: row.importance,
      },
      embeddingRef: `emb-${row.id}`,
    };
  }

  // --- Direct SQLite API ---

  private insertMemoryRow(
    id: string,
    userId: string,
    content: string,
    category: MemoryCategory,
    timestamp: string,
    importance: number,
  ): void {
    this.db
      .prepare(
        `INSERT INTO memories (id, user_id, content, category, timestamp, importance)
         VALUES (@id, @userId, @content, @category, @timestamp, @importance)
         ON CONFLICT(id) DO UPDATE SET
           content = excluded.content,
           category = excluded.category,
           timestamp = excluded.timestamp,
           importance = excluded.importance`,
      )
      .run({ id, userId, content, category, timestamp, importance });

    this.db.prepare(`DELETE FROM memories_fts WHERE memory_id = @id`).run({ id });

    this.db
      .prepare(
        `INSERT INTO memories_fts (memory_id, user_id, content, category, importance, timestamp)
         VALUES (@id, @userId, @content, @category, @importance, @timestamp)`,
      )
      .run({ id, userId, content, category, importance, timestamp });
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
    const timestamp = input.timestamp ?? nowIso();
    const importance = input.importance ?? 0.5;

    const run = this.db.transaction(() => {
      this.insertMemoryRow(
        id,
        input.userId,
        input.content,
        input.category,
        timestamp,
        importance,
      );
    });

    run();
    this.trackWrite();

    return {
      id,
      userId: input.userId,
      content: input.content,
      category: input.category,
      timestamp,
      importance,
    };
  }

  async getMemory(id: string, userId: string): Promise<MemoryRow | undefined> {
    const row = this.db
      .prepare(
        `SELECT id, user_id AS userId, content, category, timestamp, importance
         FROM memories WHERE id = @id AND user_id = @userId`,
      )
      .get({ id, userId }) as MemoryRow | undefined;
    return row;
  }

  async listMemories(
    userId: string,
    category?: MemoryCategory,
    limit = 50,
  ): Promise<readonly MemoryRow[]> {
    if (category) {
      return this.db
        .prepare(
          `SELECT id, user_id AS userId, content, category, timestamp, importance
           FROM memories
           WHERE user_id = @userId AND category = @category
           ORDER BY timestamp DESC
           LIMIT @limit`,
        )
        .all({ userId, category, limit }) as MemoryRow[];
    }

    return this.db
      .prepare(
        `SELECT id, user_id AS userId, content, category, timestamp, importance
         FROM memories
         WHERE user_id = @userId
         ORDER BY timestamp DESC
         LIMIT @limit`,
      )
      .all({ userId, limit }) as MemoryRow[];
  }

  async deleteMemory(id: string, userId: string): Promise<boolean> {
    const run = this.db.transaction(() => {
      this.db
        .prepare(`DELETE FROM memories_fts WHERE memory_id = @id`)
        .run({ id });
      const result = this.db
        .prepare(`DELETE FROM memories WHERE id = @id AND user_id = @userId`)
        .run({ id, userId });
      return result.changes > 0;
    });
    const deleted = run();
    if (deleted) {
      this.trackWrite();
    }
    return deleted;
  }

  async searchMemories(
    userId: string,
    query: string,
    limit = 10,
  ): Promise<readonly MemorySearchHit[]> {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      const recent = await this.listMemories(userId, undefined, limit);
      return recent.map((memory) => ({
        memory,
        score: memory.importance * 0.4 + recencyScore(memory.timestamp),
      }));
    }

    const ftsQuery = escapeFtsQuery(trimmed);
    let ftsRows: Array<{ memory_id: string; rank: number }> = [];

    try {
      ftsRows = this.db
        .prepare(
          `SELECT memory_id, rank
           FROM memories_fts
           WHERE memories_fts MATCH @ftsQuery AND user_id = @userId
           ORDER BY rank
           LIMIT @limit`,
        )
        .all({ ftsQuery, userId, limit: limit * 3 }) as Array<{
        memory_id: string;
        rank: number;
      }>;
    } catch {
      ftsRows = [];
    }

    const hits: MemorySearchHit[] = [];
    for (const ftsRow of ftsRows) {
      const memory = await this.getMemory(ftsRow.memory_id, userId);
      if (!memory) {
        continue;
      }
      const rankBoost = Math.max(0, -ftsRow.rank);
      const score =
        rankBoost + memory.importance * 0.35 + recencyScore(memory.timestamp);
      hits.push({ memory, score });
    }

    if (hits.length === 0) {
      const fallback = await this.listMemories(userId, undefined, limit * 5);
      const lower = trimmed.toLowerCase();
      for (const memory of fallback) {
        if (memory.content.toLowerCase().includes(lower)) {
          hits.push({
            memory,
            score: memory.importance * 0.3 + recencyScore(memory.timestamp),
          });
        }
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

    const run = this.db.transaction(() => {
      this.db
        .prepare(
          `INSERT INTO conversations (id, user_id, role, content, task_id, timestamp)
           VALUES (@id, @userId, @role, @content, @taskId, @timestamp)`,
        )
        .run({
          id,
          userId: input.userId,
          role: input.role,
          content: input.content,
          taskId: input.taskId ?? null,
          timestamp,
        });

      this.insertMemoryRow(
        `conv-mem-${id}`,
        input.userId,
        input.content,
        "conversation",
        timestamp,
        0.6,
      );
    });

    run();
    this.trackWrite();

    return {
      id,
      userId: input.userId,
      role: input.role,
      content: input.content,
      taskId: input.taskId,
      timestamp,
    };
  }

  async getRecentConversations(
    userId: string,
    limit = 10,
  ): Promise<readonly ConversationRow[]> {
    return this.db
      .prepare(
        `SELECT id, user_id AS userId, role, content, task_id AS taskId, timestamp
         FROM conversations
         WHERE user_id = @userId
         ORDER BY timestamp DESC
         LIMIT @limit`,
      )
      .all({ userId, limit }) as ConversationRow[];
  }

  async getUserFact(userId: string, key: string): Promise<string | undefined> {
    const row = this.db
      .prepare(
        `SELECT value FROM user_facts WHERE user_id = @userId AND key = @key`,
      )
      .get({ userId, key }) as { value: string } | undefined;
    return row?.value;
  }

  async listUserFacts(userId: string): Promise<readonly UserFactRow[]> {
    return this.db
      .prepare(
        `SELECT user_id AS userId, key, value, updated_at AS updatedAt
         FROM user_facts WHERE user_id = @userId ORDER BY key ASC`,
      )
      .all({ userId }) as UserFactRow[];
  }

  async saveUserFact(
    userId: string,
    key: string,
    value: string,
  ): Promise<UserFactRow> {
    const updatedAt = nowIso();
    const factMemoryId = `fact-${userId}-${key}`;
    const run = this.db.transaction(() => {
      this.db
        .prepare(
          `INSERT INTO user_facts (user_id, key, value, updated_at)
           VALUES (@userId, @key, @value, @updatedAt)
           ON CONFLICT(user_id, key) DO UPDATE SET
             value = excluded.value,
             updated_at = excluded.updated_at`,
        )
        .run({ userId, key, value, updatedAt });

      this.insertMemoryRow(
        factMemoryId,
        userId,
        `${key}: ${value}`,
        "fact",
        updatedAt,
        0.9,
      );
    });
    run();
    this.trackWrite();
    return { userId, key, value, updatedAt };
  }
}

/** Opens (or creates) the shared SQLite adapter for the configured memory path. */
export function createSqliteStorageAdapter(
  options: ConstructorParameters<typeof SqliteStorageAdapter>[0] = {},
): SqliteStorageAdapter {
  return new SqliteStorageAdapter(options);
}
