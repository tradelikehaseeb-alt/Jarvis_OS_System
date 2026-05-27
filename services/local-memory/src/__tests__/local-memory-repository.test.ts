import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  FileLocalMemoryRepository,
  InMemoryLocalMemoryRepository,
  LOCAL_MEMORY_SCHEMA_VERSION,
} from "../file-local-memory-repository";
import type { LocalMemoryRecord } from "../local-memory-record";

function sampleRecord(overrides: Partial<LocalMemoryRecord> = {}): LocalMemoryRecord {
  return {
    recordId: "rec-1",
    type: "conversation",
    userId: "user-1",
    timestamp: "2026-05-27T12:00:00.000Z",
    conversationId: "conv-1",
    content: { message: "hello" },
    schemaVersion: LOCAL_MEMORY_SCHEMA_VERSION,
    ...overrides,
  };
}

describe("InMemoryLocalMemoryRepository", () => {
  it("saves, gets, queries, and deletes records", () => {
    const repo = new InMemoryLocalMemoryRepository();

    repo.save(sampleRecord());
    repo.save(
      sampleRecord({
        recordId: "rec-2",
        type: "execution",
        taskId: "task-1",
      }),
    );

    expect(repo.get("rec-1")?.type).toBe("conversation");
    expect(
      repo.query({ userId: "user-1", types: ["execution"] }).length,
    ).toBe(1);
    expect(repo.delete("rec-1")).toBe(true);
    expect(repo.get("rec-1")).toBeUndefined();
    expect(repo.getHealth().backend).toBe("memory");
  });

  it("creates sessions", () => {
    const repo = new InMemoryLocalMemoryRepository();
    const session = repo.createSession("user-1");
    expect(session.userId).toBe("user-1");
    expect(session.sessionId).toMatch(/^local-memory-session-/);
  });
});

describe("FileLocalMemoryRepository", () => {
  it("persists records to disk and reloads on restart", () => {
    const dir = mkdtempSync(join(tmpdir(), "jarvis-local-memory-"));
    const filePath = join(dir, "local-memory.json");

    try {
      const repo = new FileLocalMemoryRepository(filePath);
      repo.save(sampleRecord());
      repo.save(
        sampleRecord({
          recordId: "rec-2",
          type: "execution",
          taskId: "task-1",
        }),
      );

      const reloaded = new FileLocalMemoryRepository(filePath);
      const history = reloaded.query({ userId: "user-1" });

      expect(history).toHaveLength(2);
      expect(reloaded.getHealth().backend).toBe("sqlite-ready");
      expect(reloaded.getHealth().filePath).toBe(filePath);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("filters query by conversationId and limit", () => {
    const dir = mkdtempSync(join(tmpdir(), "jarvis-local-memory-"));
    const filePath = join(dir, "local-memory.json");

    try {
      const repo = new FileLocalMemoryRepository(filePath);
      repo.save(sampleRecord({ recordId: "a", timestamp: "2026-05-27T10:00:00.000Z" }));
      repo.save(
        sampleRecord({
          recordId: "b",
          conversationId: "conv-2",
          timestamp: "2026-05-27T11:00:00.000Z",
        }),
      );
      repo.save(
        sampleRecord({
          recordId: "c",
          timestamp: "2026-05-27T12:00:00.000Z",
        }),
      );

      const limited = repo.query({
        userId: "user-1",
        conversationId: "conv-1",
        limit: 1,
      });

      expect(limited).toHaveLength(1);
      expect(limited[0]?.recordId).toBe("c");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
