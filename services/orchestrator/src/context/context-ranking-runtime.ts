import type { ContextQuery } from "./context-query";
import type { ContextRecord } from "./context-record";
import type { ContextScore } from "./context-score";

/**
 * Context ranking runtime contract (Phase 65).
 */
export interface ContextRankingRuntime {
  scoreContext(
    query: ContextQuery,
    record: ContextRecord,
  ): readonly ContextScore[];
  rankContext(
    query: ContextQuery,
    record: ContextRecord,
  ): readonly ContextScore[];
  selectRelevantContext(
    query: ContextQuery,
    record: ContextRecord,
    limit?: number,
  ): ContextRecord;
}
