import type { ContextQuery } from "./context-query";
import type { ContextRecord } from "./context-record";
import type { ContextScore } from "./context-score";

/**
 * Scores context turns for relevance ranking (Phase 65).
 */
export interface ContextScorer {
  scoreContext(
    query: ContextQuery,
    record: ContextRecord,
  ): readonly ContextScore[];
}
