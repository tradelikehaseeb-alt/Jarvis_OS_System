import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { createDefaultLocalMemoryRuntime } from "../create-default-local-memory-runtime";
import { FileLocalMemoryRepository } from "../file-local-memory-repository";
import { LOCAL_MEMORY_SCHEMA_VERSION } from "../file-local-memory-repository";

describe("local memory integration", () => {
  it("persists across runtime restart via file backend", () => {
    const dir = mkdtempSync(join(tmpdir(), "jarvis-local-memory-int-"));
    const filePath = join(dir, "local-memory.json");

    try {
      const runtime = createDefaultLocalMemoryRuntime({ filePath });
      runtime.saveMemory({
        recordId: "mem-conversation-1",
        type: "conversation",
        userId: "user-api-stub",
        timestamp: new Date().toISOString(),
        conversationId: "conv-int-1",
        content: { role: "user", message: "Plan sprint" },
        schemaVersion: LOCAL_MEMORY_SCHEMA_VERSION,
      });

      const reloaded = createDefaultLocalMemoryRuntime({ filePath });
      const history = reloaded.queryMemory({
        userId: "user-api-stub",
        conversationId: "conv-int-1",
      });

      expect(history).toHaveLength(1);
      expect(history[0]?.content.message).toBe("Plan sprint");
      expect(reloaded.getHealth().backend).toBe("sqlite-ready");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("falls back to in-memory backend when file disabled", () => {
    const runtime = createDefaultLocalMemoryRuntime({ useFileBackend: false });

    runtime.saveMemory({
      recordId: "mem-activity-1",
      type: "activity",
      userId: "user-1",
      timestamp: new Date().toISOString(),
      content: { action: "refresh" },
      schemaVersion: LOCAL_MEMORY_SCHEMA_VERSION,
    });

    expect(runtime.getMemory("mem-activity-1")?.type).toBe("activity");
    expect(runtime.getHealth().backend).toBe("memory");
  });

  it("deletes records through runtime API", () => {
    const dir = mkdtempSync(join(tmpdir(), "jarvis-local-memory-del-"));
    const filePath = join(dir, "local-memory.json");

    try {
      const runtime = createDefaultLocalMemoryRuntime({
        repository: new FileLocalMemoryRepository(filePath),
      });

      runtime.saveMemory({
        recordId: "to-delete",
        type: "summary",
        userId: "user-1",
        timestamp: new Date().toISOString(),
        content: { text: "summary" },
        schemaVersion: LOCAL_MEMORY_SCHEMA_VERSION,
      });

      expect(runtime.deleteMemory("to-delete")).toBe(true);
      expect(runtime.getMemory("to-delete")).toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
