import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  createFileBackedMemoryPersistenceManager,
  createTestOrchestratorService,
  StorageBackedMemoryStore,
  createFileStorageRuntime,
} from "../../index";

describe("storage runtime integration", () => {
  it("persists memory history to file and reloads after restart", async () => {
    const dir = mkdtempSync(join(tmpdir(), "jarvis-memory-file-"));
    const filePath = join(dir, "memory.json");

    try {
      const memory = createFileBackedMemoryPersistenceManager(filePath);
      const service = await createTestOrchestratorService();

      const { record } = await service.executeCreateTask(
        {
          intent: { kind: "plan", description: "Plan sprint" },
          metadata: { conversationId: "conv-file-1" },
        },
        { memoryPersistenceManager: memory },
      );

      expect(record.createTaskResponse.status).toBe("completed");

      const historyBefore = memory.queryHistory({
        userId: "user-api-stub",
        conversationId: "conv-file-1",
      });
      expect(historyBefore.length).toBeGreaterThan(0);

      const reloadedStore = new StorageBackedMemoryStore(
        createFileStorageRuntime(filePath),
      );
      const historyAfter = reloadedStore.queryHistory({
        userId: "user-api-stub",
        conversationId: "conv-file-1",
      });

      expect(historyAfter.length).toBe(historyBefore.length);
      expect(historyAfter.some((r) => r.type === "conversation")).toBe(true);
      expect(historyAfter.some((r) => r.type === "execution")).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("preserves in-memory default behavior for task execution", async () => {
    const { createDefaultMemoryPersistenceManager } = await import(
      "../../memory/create-default-memory-persistence-manager"
    );
    const memory = createDefaultMemoryPersistenceManager();
    const service = await createTestOrchestratorService();

    const { record } = await service.executeCreateTask(
      { intent: { kind: "research", description: "Find docs" } },
      { memoryPersistenceManager: memory },
    );

    expect(record.createTaskResponse.status).toBe("completed");
    expect(
      memory.queryHistory({ userId: "user-api-stub" }).length,
    ).toBeGreaterThan(0);
  });
});
