import type { ContextQuery } from "../context/context-query";
import type { ContextRecord } from "../context/context-record";
import type { ContextScore } from "../context/context-score";
import type { ContextRuntime } from "../context/context-runtime";
import type { ContextRelevanceRanker } from "./context-relevance-ranker";

export interface MemoryContextEngineResult {
  readonly raw: ContextRecord;
  readonly ranked: ContextRecord;
  readonly scores: readonly ContextScore[];
  readonly cacheHit: boolean;
}

/**
 * Builds and ranks execution context with safe caching (Phase 93).
 */
export class MemoryContextEngine {
  constructor(
    private readonly contextRuntime: ContextRuntime,
    private readonly ranker: ContextRelevanceRanker,
  ) {}

  buildRankedContext(query: ContextQuery): MemoryContextEngineResult {
    const raw = this.contextRuntime.buildContext(query);
    const cachedScores = this.ranker.getCachedScores(query, raw);
    const ranked = this.ranker.selectRelevantContext(
      query,
      raw,
      query.relevantLimit,
    );
    const scores =
      cachedScores ??
      this.ranker.rankContext(query, raw).filter((entry) => entry.score > 0);

    return {
      raw,
      ranked,
      scores,
      cacheHit: cachedScores !== undefined,
    };
  }
}
