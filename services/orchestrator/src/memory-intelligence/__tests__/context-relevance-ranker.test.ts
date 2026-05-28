import { describe, expect, it } from "vitest";

import { ContextRelevanceRanker } from "../context-relevance-ranker";
import type { ContextRecord } from "../../context/context-record";

function sampleRecord(turns: ContextRecord["turns"]): ContextRecord {
  return {
    contextId: "ctx-1",
    userId: "user-1",
    conversationId: "conv-1",
    intentDescription: "Plan dashboard rollout",
    turns,
    summary: "summary",
    builtAt: new Date().toISOString(),
    source: "conversation-history",
  };
}

describe("ContextRelevanceRanker", () => {
  it("ranks intent-relevant turns above unrelated history", () => {
    const ranker = new ContextRelevanceRanker();
    const record = sampleRecord([
      {
        role: "user",
        message: "Weather forecast for Lahore",
        timestamp: new Date(Date.now() - 86_400_000).toISOString(),
      },
      {
        role: "user",
        message: "Plan dashboard rollout milestones",
        timestamp: new Date().toISOString(),
        taskId: "task-1",
      },
    ]);

    const ranked = ranker.selectRelevantContext(
      {
        userId: "user-1",
        conversationId: "conv-1",
        intentDescription: "Plan dashboard rollout",
        taskId: "task-1",
      },
      record,
      1,
    );

    expect(ranked.turns[0]?.message).toContain("dashboard rollout");
  });

  it("reuses cached ranked context for identical queries", () => {
    const ranker = new ContextRelevanceRanker(undefined, 5, 60_000);
    const query = {
      userId: "user-1",
      conversationId: "conv-1",
      intentDescription: "Plan dashboard rollout",
    };
    const record = sampleRecord([
      {
        role: "user",
        message: "Plan dashboard rollout milestones",
        timestamp: new Date().toISOString(),
      },
    ]);

    ranker.selectRelevantContext(query, record, 1);
    const cached = ranker.getCachedScores(query, record);
    expect(cached?.length).toBeGreaterThan(0);
  });
});
