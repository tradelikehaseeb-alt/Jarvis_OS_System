import type { ContextScore } from "../context/context-score";
import type { ContextRecord } from "../context/context-record";
import type { MemoryRecallQuery } from "./memory-recall-query";
import type { MemoryRecallRecord } from "./memory-recall-record";

/**
 * Strategy for selecting recalled memories from ranked context (Phase 66).
 */
export interface MemoryRecallStrategy {
  readonly strategyId: string;
  selectMemories(
    query: MemoryRecallQuery,
    rankedContext: ContextRecord,
    scores: readonly ContextScore[],
  ): readonly MemoryRecallRecord[];
}
