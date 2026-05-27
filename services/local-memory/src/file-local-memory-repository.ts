import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { LocalMemoryHealth } from "./local-memory-health";
import type { LocalMemoryQuery } from "./local-memory-query";
import type { LocalMemoryRecord } from "./local-memory-record";
import type { LocalMemorySession } from "./local-memory-session";
import type { LocalMemoryRepository } from "./local-memory-repository";

/** Default local memory JSON store (Phase 62). */
export const DEFAULT_LOCAL_MEMORY_FILE = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "api-gateway",
  ".jarvis-task-store",
  "local-memory.json",
);

export const LOCAL_MEMORY_SCHEMA_VERSION = 1;

interface LocalMemoryStoreFile {
  readonly schemaVersion: number;
  readonly backend: "file";
  readonly sqliteReady: true;
  readonly records: Record<string, LocalMemoryRecord>;
  readonly sessions: Record<string, LocalMemorySession>;
}

function nowIso(): string {
  return new Date().toISOString();
}

function emptyStore(): LocalMemoryStoreFile {
  return {
    schemaVersion: LOCAL_MEMORY_SCHEMA_VERSION,
    backend: "file",
    sqliteReady: true,
    records: {},
    sessions: {},
  };
}

function matchesQuery(record: LocalMemoryRecord, query: LocalMemoryQuery): boolean {
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

let sessionCounter = 0;

function nextSessionId(): string {
  sessionCounter += 1;
  return `local-memory-session-${sessionCounter}`;
}

/**
 * In-memory local memory repository — fallback backend (Phase 62).
 */
export class InMemoryLocalMemoryRepository implements LocalMemoryRepository {
  private readonly records = new Map<string, LocalMemoryRecord>();
  private readonly sessions = new Map<string, LocalMemorySession>();

  save(record: LocalMemoryRecord): LocalMemoryRecord {
    this.records.set(record.recordId, record);
    return record;
  }

  get(recordId: string): LocalMemoryRecord | undefined {
    return this.records.get(recordId);
  }

  query(query: LocalMemoryQuery): readonly LocalMemoryRecord[] {
    const results = [...this.records.values()]
      .filter((record) => matchesQuery(record, query))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    return query.limit ? results.slice(-query.limit) : results;
  }

  delete(recordId: string): boolean {
    return this.records.delete(recordId);
  }

  getHealth(): LocalMemoryHealth {
    return {
      status: "healthy",
      backend: "memory",
      recordCount: this.records.size,
      message: "In-memory local memory fallback",
      checkedAt: nowIso(),
    };
  }

  createSession(userId: string): LocalMemorySession {
    const session: LocalMemorySession = {
      sessionId: nextSessionId(),
      userId,
      startedAt: nowIso(),
    };
    this.sessions.set(session.sessionId, session);
    return session;
  }
}

/**
 * File-backed local memory repository — JSON store with SQLite-ready schema (Phase 62).
 */
export class FileLocalMemoryRepository implements LocalMemoryRepository {
  private store: LocalMemoryStoreFile = emptyStore();

  constructor(private readonly filePath: string = DEFAULT_LOCAL_MEMORY_FILE) {
    this.loadFromDisk();
  }

  save(record: LocalMemoryRecord): LocalMemoryRecord {
    this.store.records[record.recordId] = record;
    this.flushToDisk();
    return record;
  }

  get(recordId: string): LocalMemoryRecord | undefined {
    return this.store.records[recordId];
  }

  query(query: LocalMemoryQuery): readonly LocalMemoryRecord[] {
    const results = Object.values(this.store.records)
      .filter((record) => matchesQuery(record, query))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    return query.limit ? results.slice(-query.limit) : results;
  }

  delete(recordId: string): boolean {
    if (!this.store.records[recordId]) {
      return false;
    }
    delete this.store.records[recordId];
    this.flushToDisk();
    return true;
  }

  getHealth(): LocalMemoryHealth {
    return {
      status: existsSync(this.filePath) ? "healthy" : "degraded",
      backend: "sqlite-ready",
      recordCount: Object.keys(this.store.records).length,
      message: existsSync(this.filePath)
        ? `Local memory file at ${this.filePath}`
        : "Local memory file not yet created",
      checkedAt: nowIso(),
      filePath: this.filePath,
    };
  }

  createSession(userId: string): LocalMemorySession {
    const session: LocalMemorySession = {
      sessionId: nextSessionId(),
      userId,
      startedAt: nowIso(),
    };
    this.store.sessions[session.sessionId] = session;
    this.flushToDisk();
    return session;
  }

  getFilePath(): string {
    return this.filePath;
  }

  private loadFromDisk(): void {
    if (!existsSync(this.filePath)) {
      return;
    }

    try {
      const raw = readFileSync(this.filePath, "utf-8");
      const parsed = JSON.parse(raw) as LocalMemoryStoreFile;
      if (parsed.schemaVersion === LOCAL_MEMORY_SCHEMA_VERSION) {
        this.store = parsed;
      }
    } catch {
      /* ignore corrupt store in dev */
    }
  }

  private flushToDisk(): void {
    const dir = dirname(this.filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(this.filePath, JSON.stringify(this.store, null, 2), "utf-8");
  }
}
