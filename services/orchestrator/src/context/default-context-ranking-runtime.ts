import { summarizeTurns } from "../shared/history-utils";
import type { ContextQuery } from "./context-query";
import type { ContextRecord, ContextTurn } from "./context-record";
import type { ContextScore } from "./context-score";
import type { ContextScorer } from "./context-scorer";
import type { ContextRankingRuntime } from "./context-ranking-runtime";
import { DefaultContextScorer } from "./default-context-scorer";

function refineContextRecord(
  record: ContextRecord,
  turns: readonly ContextTurn[],
): ContextRecord {
  return {
    ...record,
    contextId: `${record.contextId}-ranked-${turns.length}`,
    turns,
    summary: summarizeTurns(turns, record.intentDescription, "relevant"),
    builtAt: new Date().toISOString(),
    source: turns.length > 0 ? record.source : "fallback",
  };
}

/**
 * Default context ranking runtime (Phase 65).
 */
export class DefaultContextRankingRuntime implements ContextRankingRuntime {
  constructor(
    private readonly scorer: ContextScorer = new DefaultContextScorer(),
    private readonly maxTurns = 5,
  ) {}

  scoreContext(
    query: ContextQuery,
    record: ContextRecord,
  ): readonly ContextScore[] {
    return this.scorer.scoreContext(query, record);
  }

  rankContext(
    query: ContextQuery,
    record: ContextRecord,
  ): readonly ContextScore[] {
    return [...this.scoreContext(query, record)].sort((a, b) => {
      const byScore = b.score - a.score;
      if (byScore !== 0) {
        return byScore;
      }
      return b.turnIndex - a.turnIndex;
    });
  }

  selectRelevantContext(
    query: ContextQuery,
    record: ContextRecord,
    limit = this.maxTurns,
  ): ContextRecord {
    if (record.turns.length === 0) {
      return record;
    }

    const ranked = this.rankContext(query, record);
    const selectedIndices = new Set(
      ranked.slice(0, limit).map((entry) => entry.turnIndex),
    );
    const selectedTurns = record.turns.filter((_, index) =>
      selectedIndices.has(index),
    );

    return refineContextRecord(record, selectedTurns);
  }
}
