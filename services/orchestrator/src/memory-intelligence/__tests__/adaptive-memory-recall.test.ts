import { describe, expect, it } from "vitest";

import { createDefaultContextRuntime } from "../../context/create-default-context-runtime";
import { createDefaultConversationHistoryRuntime } from "../../conversation-history";
import { createDefaultMemoryIntelligenceBundle } from "../create-default-memory-intelligence-bundle";

describe("AdaptiveMemoryRecall", () => {
  it("filters duplicate recalled content", () => {
    const history = createDefaultConversationHistoryRuntime();
    history.saveConversation({
      conversationId: "conv-adaptive",
      userId: "user-1",
      role: "user",
      message: "Plan dashboard rollout milestones",
    });
    history.saveConversation({
      conversationId: "conv-adaptive",
      userId: "user-1",
      role: "user",
      message: "Plan dashboard rollout milestones",
    });

    const bundle = createDefaultMemoryIntelligenceBundle({
      conversationHistory: history,
    });

    const memories = bundle.adaptiveMemoryRecall.getRelevantMemories({
      userId: "user-1",
      conversationId: "conv-adaptive",
      intentDescription: "Plan dashboard rollout",
    });

    const unique = new Set(memories.map((memory) => memory.content.trim()));
    expect(unique.size).toBe(memories.filter((m) => m.source === "conversation-history").length);
  });

  it("injects Remembered context metadata", () => {
    const bundle = createDefaultMemoryIntelligenceBundle();
    const history = bundle.conversationHistory;
    history.saveConversation({
      conversationId: "conv-meta",
      userId: "user-1",
      role: "user",
      message: "Continue Dubai trip planning",
    });

    const contextRuntime = createDefaultContextRuntime({ conversationHistory: history });
    const raw = contextRuntime.buildContext({
      userId: "user-1",
      conversationId: "conv-meta",
      intentDescription: "Plan Dubai trip",
    });

    const agentContext = bundle.adaptiveMemoryRecall.injectMemoryContext(
      {
        userId: "user-1",
        conversationId: "conv-meta",
        intentDescription: "Plan Dubai trip",
      },
      { contextRef: "ctx-1", userId: "user-1", metadata: {} },
      raw,
    );

    const intelligence = agentContext.metadata?.jarvisMemoryIntelligence as
      | { message?: string }
      | undefined;
    expect(intelligence?.message).toBe("Remembered context");
  });
});
