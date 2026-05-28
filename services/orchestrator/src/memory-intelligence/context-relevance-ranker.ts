import type { ContextQuery } from "../context/context-query";
import type { ContextRecord } from "../context/context-record";
import type { ContextScore } from "../context/context-score";
import type { ContextRankingRuntime } from "../context/context-ranking-runtime";
import { DefaultContextRankingRuntime } from "../context/default-context-ranking-runtime";
import { DefaultContextScorer } from "../context/default-context-scorer";
import { MEMORY_INTELLIGENCE_RELEVANCE_RULES } from "./memory-intelligence-rules";
import type { AdaptiveContextScorer } from "./adaptive-context-scorer";

export interface RankedContextCacheEntry {
  readonly fingerprint: string;
  readonly ranked: ContextRecord;
  readonly scores: readonly ContextScore[];
  readonly cachedAt: number;
}

/**
 * Enhanced relevance ranker with intelligence rules and optional adaptive scoring (Phase 93).
 */
export class ContextRelevanceRanker implements ContextRankingRuntime {
  private readonly inner: DefaultContextRankingRuntime;
  private readonly cache = new Map<string, RankedContextCacheEntry>();
  private readonly cacheTtlMs: number;

  constructor(
    scorer: AdaptiveContextScorer | DefaultContextScorer = new DefaultContextScorer(
      MEMORY_INTELLIGENCE_RELEVANCE_RULES,
    ),
    maxTurns = 5,
    cacheTtlMs = 15_000,
  ) {
    this.inner = new DefaultContextRankingRuntime(scorer, maxTurns);
    this.cacheTtlMs = cacheTtlMs;
  }

  private fingerprint(query: ContextQuery, record: ContextRecord): string {
    return [
      query.userId,
      query.conversationId ?? "",
      query.taskId ?? "",
      query.intentDescription ?? "",
      record.turns.length,
      record.builtAt,
    ].join("|");
  }

  private getCached(
    query: ContextQuery,
    record: ContextRecord,
  ): RankedContextCacheEntry | undefined {
    const key = this.fingerprint(query, record);
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }
    if (Date.now() - entry.cachedAt > this.cacheTtlMs) {
      this.cache.delete(key);
      return undefined;
    }
    return entry;
  }

  scoreContext(
    query: ContextQuery,
    record: ContextRecord,
  ): readonly ContextScore[] {
    return this.inner.scoreContext(query, record);
  }

  rankContext(
    query: ContextQuery,
    record: ContextRecord,
  ): readonly ContextScore[] {
    return this.inner.rankContext(query, record);
  }

  selectRelevantContext(
    query: ContextQuery,
    record: ContextRecord,
    limit?: number,
  ): ContextRecord {
    const cached = this.getCached(query, record);
    if (cached) {
      return cached.ranked;
    }

    const ranked = this.inner.selectRelevantContext(query, record, limit);
    const scores = this.inner.rankContext(query, record);
    const key = this.fingerprint(query, record);
    this.cache.set(key, {
      fingerprint: key,
      ranked,
      scores,
      cachedAt: Date.now(),
    });
    return ranked;
  }

  /** Exposes last cached scores for recall (Phase 93). */
  getCachedScores(
    query: ContextQuery,
    record: ContextRecord,
  ): readonly ContextScore[] | undefined {
    return this.getCached(query, record)?.scores;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
