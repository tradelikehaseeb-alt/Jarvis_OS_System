import { describe, expect, it } from "vitest";

import { createDefaultContextRuntime } from "../create-default-context-runtime";
import { createDefaultContextRankingRuntime } from "../create-default-context-ranking-runtime";
import type { ContextRecord } from "../context-record";

function sampleRecord(turns: ContextRecord["turns"]): ContextRecord {
  return {
    contextId: "ctx-test",
    userId: "user-1",
    conversationId: "conv-1",
    taskId: "task-1",
    intentDescription: "dashboard rollout plan",
    turns,
    summary: "test",
    builtAt: new Date().toISOString(),
    source: "conversation-history",
  };
}

describe("DefaultContextRankingRuntime", () => {
  it("scores, ranks, and selects top relevant turns", () => {
    const runtime = createDefaultContextRuntime({ useFileBackend: false });
    const ranking = createDefaultContextRankingRuntime({ maxTurns: 2 });

    const record = sampleRecord([
      {
        role: "user",
        message: "Old unrelated note",
        timestamp: "2026-05-27T10:00:00.000Z",
      },
      {
        role: "user",
        message: "Previous dashboard question",
        timestamp: "2026-05-27T11:00:00.000Z",
      },
      {
        role: "assistant",
        message: "Dashboard rollout draft",
        timestamp: "2026-05-27T12:00:00.000Z",
        taskId: "task-1",
      },
    ]);

    const query = {
      userId: "user-1",
      conversationId: "conv-1",
      taskId: "task-1",
      intentDescription: "Plan dashboard rollout",
    };

    const scores = ranking.scoreContext(query, record);
    expect(scores).toHaveLength(3);

    const ranked = ranking.rankContext(query, record);
    expect(ranked[0]?.turn.message.toLowerCase()).toContain("dashboard");

    const selected = ranking.selectRelevantContext(query, record);
    expect(selected.turns.length).toBeLessThanOrEqual(2);
    expect(
      selected.turns.some((turn) =>
        turn.message.toLowerCase().includes("dashboard"),
      ),
    ).toBe(true);
    expect(selected.summary).toContain("relevant turn");
  });

  it("preserves fallback record when no turns exist", () => {
    const ranking = createDefaultContextRankingRuntime();
    const fallback = sampleRecord([]);
    fallback.source = "fallback";

    const selected = ranking.selectRelevantContext(
      { userId: "user-1" },
      fallback,
    );

    expect(selected.turns).toHaveLength(0);
    expect(selected.source).toBe("fallback");
  });

  it("builds ranked context through ContextRuntime pipeline", () => {
    const contextRuntime = createDefaultContextRuntime({ useFileBackend: false });
    const ranking = createDefaultContextRankingRuntime({ maxTurns: 1 });

    const raw = contextRuntime.buildContext({
      userId: "user-1",
      conversationId: "conv-1",
      intentDescription: "Find API docs",
    });

    expect(raw.source).toBe("fallback");

    const selected = ranking.selectRelevantContext(
      { userId: "user-1", conversationId: "conv-1" },
      raw,
    );
    expect(selected.turns).toHaveLength(0);
  });
});
