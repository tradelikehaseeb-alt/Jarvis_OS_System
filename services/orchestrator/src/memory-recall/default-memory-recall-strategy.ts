import type { ContextScore } from "../context/context-score";
import type { ContextRecord } from "../context/context-record";
import type { MemoryRecallStrategy } from "./memory-recall-strategy";
import type { MemoryRecallQuery } from "./memory-recall-query";
import type { MemoryRecallRecord } from "./memory-recall-record";

function nowIso(): string {
  return new Date().toISOString();
}

let recallSequence = 0;

function nextRecallId(): string {
  recallSequence += 1;
  return `recall-${Date.now()}-${recallSequence}`;
}

/**
 * Default recall strategy — maps ranked context scores to memory records (Phase 66).
 */
export class DefaultMemoryRecallStrategy implements MemoryRecallStrategy {
  readonly strategyId = "ranked-context" as const;

  selectMemories(
    query: MemoryRecallQuery,
    rankedContext: ContextRecord,
    scores: readonly ContextScore[],
  ): readonly MemoryRecallRecord[] {
    const limit = query.limit ?? scores.length;
    const topScores = [...scores]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    if (topScores.length === 0 && rankedContext.turns.length === 0) {
      return [];
    }

    const recalledAt = nowIso();
    const selected =
      topScores.length > 0
        ? topScores
        : rankedContext.turns.map((turn, turnIndex) => ({
            turnIndex,
            score: 0,
            reason: "fallback-order",
            turn,
          }));

    return selected.map((entry) => ({
      recallId: nextRecallId(),
      userId: query.userId,
      conversationId: query.conversationId ?? rankedContext.conversationId,
      taskId: entry.turn.taskId ?? query.taskId ?? rankedContext.taskId,
      content: entry.turn.message,
      role: entry.turn.role,
      score: entry.score,
      source: "conversation-history" as const,
      recalledAt,
    }));
  }
}
