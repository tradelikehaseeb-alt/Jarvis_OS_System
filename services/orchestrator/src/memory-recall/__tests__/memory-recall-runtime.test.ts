import { describe, expect, it } from "vitest";

import { createDefaultContextRuntimeBundle } from "../../context/index";
import { createDefaultMemoryRecallRuntime } from "../create-default-memory-recall-runtime";
import { JARVIS_MEMORY_RECALL_METADATA_KEY } from "../memory-recall-record";

describe("DefaultMemoryRecallRuntime", () => {
  it("recalls relevant memories from ranked conversation context", () => {
    const { contextRuntime, contextRankingRuntime, conversationHistory } =
      createDefaultContextRuntimeBundle();

    conversationHistory.saveConversation({
      conversationId: "conv-recall-1",
      userId: "user-1",
      role: "user",
      message: "Previous dashboard rollout notes",
    });
    conversationHistory.saveConversation({
      conversationId: "conv-recall-1",
      userId: "user-1",
      role: "assistant",
      message: "Dashboard rollout checklist ready",
      taskId: "task-old",
    });

    const recall = createDefaultMemoryRecallRuntime({
      contextRuntime,
      contextRankingRuntime,
    });

    const memories = recall.getRelevantMemories({
      userId: "user-1",
      conversationId: "conv-recall-1",
      intentDescription: "Plan dashboard rollout",
      limit: 2,
    });

    expect(memories.length).toBeGreaterThan(0);
    expect(memories.some((m) => m.source === "conversation-history")).toBe(true);
    expect(
      memories.some((m) => m.content.toLowerCase().includes("dashboard")),
    ).toBe(true);
  });

  it("returns fallback memory when no history exists", () => {
    const { contextRuntime, contextRankingRuntime } =
      createDefaultContextRuntimeBundle();

    const recall = createDefaultMemoryRecallRuntime({
      contextRuntime,
      contextRankingRuntime,
    });

    const memories = recall.recallMemory({
      userId: "user-1",
      conversationId: "conv-empty",
      intentDescription: "Find API docs",
    });

    expect(memories).toHaveLength(1);
    expect(memories[0]?.source).toBe("fallback");
  });

  it("injects recalled memories into agent context metadata", () => {
    const { contextRuntime, contextRankingRuntime, conversationHistory } =
      createDefaultContextRuntimeBundle();

    conversationHistory.saveConversation({
      conversationId: "conv-inject-1",
      userId: "user-1",
      role: "user",
      message: "Remember the sprint plan",
    });

    const recall = createDefaultMemoryRecallRuntime({
      contextRuntime,
      contextRankingRuntime,
    });

    const contextRecord = contextRuntime.buildContext({
      userId: "user-1",
      conversationId: "conv-inject-1",
      intentDescription: "Continue sprint plan",
    });

    const injected = recall.injectMemoryContext(
      {
        userId: "user-1",
        conversationId: "conv-inject-1",
        intentDescription: "Continue sprint plan",
      },
      {
        contextRef: "ctx-ref-1",
        userId: "user-1",
        metadata: {},
      },
      contextRecord,
    );

    expect(injected.metadata?.[JARVIS_MEMORY_RECALL_METADATA_KEY]).toBeDefined();
    expect(
      Array.isArray(injected.metadata?.[JARVIS_MEMORY_RECALL_METADATA_KEY]),
    ).toBe(true);
  });
});
