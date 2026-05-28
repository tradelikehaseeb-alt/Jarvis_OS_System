import { describe, expect, it } from "vitest";

import { createDefaultMemoryIntelligenceBundle } from "../create-default-memory-intelligence-bundle";

describe("memory intelligence performance", () => {
  it("serves repeated recall under latency budget with cache", () => {
    const bundle = createDefaultMemoryIntelligenceBundle();
    const history = bundle.conversationHistory;

    for (let index = 0; index < 40; index += 1) {
      history.saveConversation({
        conversationId: "conv-perf",
        userId: "user-1",
        role: "user",
        message: `Turn ${index} about dashboard rollout planning`,
      });
    }

    const query = {
      userId: "user-1",
      conversationId: "conv-perf",
      intentDescription: "Plan dashboard rollout",
    };

    const coldStart = performance.now();
    bundle.adaptiveMemoryRecall.getRelevantMemories(query);
    const coldMs = performance.now() - coldStart;

    const warmStart = performance.now();
    bundle.adaptiveMemoryRecall.getRelevantMemories(query);
    const warmMs = performance.now() - warmStart;

    expect(coldMs).toBeLessThan(250);
    expect(warmMs).toBeLessThan(coldMs + 5);
  });
});
