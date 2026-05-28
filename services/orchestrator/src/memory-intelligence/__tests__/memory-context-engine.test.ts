import { describe, expect, it } from "vitest";

import { createDefaultContextRuntime } from "../../context/create-default-context-runtime";
import { createDefaultConversationHistoryRuntime } from "../../conversation-history";
import { ContextRelevanceRanker } from "../context-relevance-ranker";
import { MemoryContextEngine } from "../memory-context-engine";

describe("MemoryContextEngine", () => {
  it("builds ranked context from conversation history", () => {
    const history = createDefaultConversationHistoryRuntime();
    history.saveConversation({
      conversationId: "conv-engine",
      userId: "user-1",
      role: "user",
      message: "Earlier discussion about dashboard rollout",
    });

    const contextRuntime = createDefaultContextRuntime({ conversationHistory: history });
    const ranker = new ContextRelevanceRanker();
    const engine = new MemoryContextEngine(contextRuntime, ranker);

    const result = engine.buildRankedContext({
      userId: "user-1",
      conversationId: "conv-engine",
      intentDescription: "Plan dashboard rollout",
    });

    expect(result.ranked.turns.length).toBeGreaterThan(0);
    expect(result.scores.length).toBeGreaterThan(0);
  });
});
