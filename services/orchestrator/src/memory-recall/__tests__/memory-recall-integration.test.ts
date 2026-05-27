import { describe, expect, it } from "vitest";

import { createDefaultContextRuntimeBundle } from "../../context/index";
import { createDefaultLocalMemoryRuntime } from "@jarvis/local-memory";

import {
  createLocalBackedMemoryPersistenceManager,
  createTestOrchestratorService,
} from "../../index";

describe("memory recall integration", () => {
  it("recalls memories during task execution conversation flow", async () => {
    const sharedRuntime = createDefaultLocalMemoryRuntime({ useFileBackend: false });
    const bundle = createDefaultContextRuntimeBundle({ localMemoryRuntime: sharedRuntime });
    const memory = createLocalBackedMemoryPersistenceManager(undefined, undefined, {
      runtime: sharedRuntime,
      useFileBackend: false,
    });

    bundle.conversationHistory.saveConversation({
      conversationId: "conv-flow-1",
      userId: "user-api-stub",
      role: "user",
      message: "Earlier dashboard rollout discussion",
    });

    const service = await createTestOrchestratorService();

    const { record } = await service.executeCreateTask(
      {
        intent: { kind: "plan", description: "Plan dashboard rollout" },
        metadata: { conversationId: "conv-flow-1" },
      },
      {
        memoryPersistenceManager: memory,
        contextRuntime: bundle.contextRuntime,
        contextRankingRuntime: bundle.contextRankingRuntime,
        conversationHistoryRuntime: bundle.conversationHistory,
        memoryRecallRuntime: bundle.memoryRecallRuntime,
      },
    );

    expect(record.createTaskResponse.status).toBe("completed");

    const memoryRecall = record.taskStatus.output?.memoryRecall as {
      count: number;
      source: string;
    };

    expect(memoryRecall.count).toBeGreaterThan(0);
    expect(memoryRecall.source).toBe("conversation-history");
  });

  it("uses fallback recall when conversation has no prior history", async () => {
    const bundle = createDefaultContextRuntimeBundle();
    const service = await createTestOrchestratorService();

    const { record } = await service.executeCreateTask(
      {
        intent: { kind: "research", description: "Find API docs" },
        metadata: { conversationId: "conv-new-1" },
      },
      {
        contextRuntime: bundle.contextRuntime,
        contextRankingRuntime: bundle.contextRankingRuntime,
        conversationHistoryRuntime: bundle.conversationHistory,
        memoryRecallRuntime: bundle.memoryRecallRuntime,
      },
    );

    const memoryRecall = record.taskStatus.output?.memoryRecall as {
      count: number;
      source: string;
    };

    expect(memoryRecall.count).toBeGreaterThan(0);
  });
});
