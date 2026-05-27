import { describe, expect, it } from "vitest";

import {
  createDefaultContextRuntimeBundle,
  JARVIS_CONTEXT_METADATA_KEY,
} from "../index";
import {
  createDefaultMemoryPersistenceManager,
  createTestOrchestratorService,
} from "../../index";

describe("context injection integration", () => {
  it("injects conversation history into task execution output", async () => {
    const { contextRuntime, conversationHistory } =
      createDefaultContextRuntimeBundle();

    conversationHistory.saveConversation({
      conversationId: "conv-context-1",
      userId: "user-api-stub",
      role: "user",
      message: "Previous dashboard question",
    });

    const service = await createTestOrchestratorService();
    const memory = createDefaultMemoryPersistenceManager();

    const { record } = await service.executeCreateTask(
      {
        intent: { kind: "plan", description: "Plan dashboard rollout" },
        metadata: { conversationId: "conv-context-1" },
      },
      {
        memoryPersistenceManager: memory,
        contextRuntime,
        conversationHistoryRuntime: conversationHistory,
      },
    );

    expect(record.createTaskResponse.status).toBe("completed");

    const contextOutput = record.taskStatus.output?.context as {
      source: string;
      turnCount: number;
      summary: string;
    };

    expect(contextOutput.source).toBe("conversation-history");
    expect(contextOutput.turnCount).toBeGreaterThan(0);
    expect(contextOutput.summary).toContain("turn");
  });

  it("uses fallback context when conversation history is empty", async () => {
    const { contextRuntime, conversationHistory } =
      createDefaultContextRuntimeBundle();

    const service = await createTestOrchestratorService();

    const { record } = await service.executeCreateTask(
      {
        intent: { kind: "research", description: "Find API docs" },
        metadata: { conversationId: "conv-empty-1" },
      },
      {
        contextRuntime,
        conversationHistoryRuntime: conversationHistory,
      },
    );

    const contextOutput = record.taskStatus.output?.context as {
      source: string;
      turnCount: number;
    };

    expect(contextOutput.source).toBe("conversation-history");
    expect(contextOutput.turnCount).toBe(1);
    expect(
      (record.taskStatus.output?.agentPayload as Record<string, unknown>) ??
        record.taskStatus.output,
    ).toBeDefined();
    expect(JARVIS_CONTEXT_METADATA_KEY).toBe("jarvisContext");
  });
});
