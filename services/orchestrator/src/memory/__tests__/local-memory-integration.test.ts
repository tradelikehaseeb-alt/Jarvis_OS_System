import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  createLocalBackedMemoryPersistenceManager,
  createTestOrchestratorService,
  LocalMemoryBackedMemoryStore,
} from "../../index";
import { createDefaultLocalMemoryRuntime } from "@jarvis/local-memory";

import { createTestTempDir } from "./test-temp-dir";

describe("local memory orchestrator integration", () => {
  it("persists task execution history to local file and reloads after restart", async () => {
    const dir = createTestTempDir("jarvis-orchestrator-local-memory-");
    const filePath = join(dir, "local-memory.json");

    const memory = createLocalBackedMemoryPersistenceManager(filePath);
    const service = await createTestOrchestratorService();

    const { record } = await service.executeCreateTask(
      {
        intent: { kind: "plan", description: "Plan sprint" },
        metadata: { conversationId: "conv-local-1" },
      },
      { memoryPersistenceManager: memory },
    );

    expect(record.createTaskResponse.status).toBe("completed");

    const historyBefore = memory.queryHistory({
      userId: "user-api-stub",
      conversationId: "conv-local-1",
    });
    expect(historyBefore.length).toBeGreaterThan(0);

    const reloadedStore = new LocalMemoryBackedMemoryStore(
      createDefaultLocalMemoryRuntime({ filePath }),
    );
    const historyAfter = reloadedStore.queryHistory({
      userId: "user-api-stub",
      conversationId: "conv-local-1",
    });

    expect(historyAfter.length).toBe(historyBefore.length);
    expect(historyAfter.some((r) => r.type === "conversation")).toBe(true);
    expect(historyAfter.some((r) => r.type === "execution")).toBe(true);
  });

  it("preserves in-memory default behavior when local file backend disabled", async () => {
    const memory = createLocalBackedMemoryPersistenceManager(undefined, undefined, {
      useFileBackend: false,
    });
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
