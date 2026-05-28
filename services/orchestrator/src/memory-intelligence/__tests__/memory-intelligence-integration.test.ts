import { describe, expect, it } from "vitest";

import { createDefaultLocalMemoryRuntime } from "@jarvis/local-memory";

import {
  createLocalBackedMemoryPersistenceManager,
  createTestOrchestratorService,
} from "../../index";
import { createDefaultContextRuntimeBundle } from "../../context";

describe("memory intelligence integration", () => {
  it("recalls relevant context across a long session", async () => {
    const sharedRuntime = createDefaultLocalMemoryRuntime({ useFileBackend: false });
    const bundle = createDefaultContextRuntimeBundle({
      localMemoryRuntime: sharedRuntime,
      useMemoryIntelligence: true,
    });
    const memory = createLocalBackedMemoryPersistenceManager(undefined, undefined, {
      runtime: sharedRuntime,
      useFileBackend: false,
    });

    const conversationId = "conv-long-session";
    const turns = [
      "Kickoff notes for analytics dashboard",
      "Discussed rollout timeline and owners",
      "Plan dashboard rollout milestones for Q3",
    ];

    for (const message of turns) {
      bundle.conversationHistory.saveConversation({
        conversationId,
        userId: "user-api-stub",
        role: "user",
        message,
      });
    }

    const service = await createTestOrchestratorService();
    const { record } = await service.executeCreateTask(
      {
        intent: { kind: "plan", description: "Plan dashboard rollout milestones" },
        metadata: { conversationId },
      },
      {
        memoryPersistenceManager: memory,
        contextRuntime: bundle.contextRuntime,
        contextRankingRuntime: bundle.contextRankingRuntime,
        conversationHistoryRuntime: bundle.conversationHistory,
        memoryRecallRuntime: bundle.memoryRecallRuntime,
      },
    );

    const memoryRecall = record.taskStatus.output?.memoryRecall as {
      count: number;
      source: string;
      message?: string;
      snippets?: string[];
    };

    expect(record.createTaskResponse.status).toBe("completed");
    expect(memoryRecall.count).toBeGreaterThan(0);
    expect(memoryRecall.source).toBe("conversation-history");
    expect(memoryRecall.message).toBe("Remembered context");
    expect(memoryRecall.snippets?.length).toBeGreaterThan(0);
  });
});
