import type { AgentContext } from "@jarvis/agents-shared";

import type { ContextQuery } from "../context/context-query";
import type { ContextRecord } from "../context/context-record";
import { JARVIS_CONTEXT_METADATA_KEY } from "../context/context-record";
import type { MemoryRecallQuery } from "../memory-recall/memory-recall-query";
import type { MemoryRecallRecord } from "../memory-recall/memory-recall-record";
import { JARVIS_MEMORY_RECALL_METADATA_KEY } from "../memory-recall/memory-recall-record";
import type { MemoryRecallRuntime } from "../memory-recall/memory-recall-runtime";
import type { MemoryRecallStrategy } from "../memory-recall/memory-recall-strategy";
import { DefaultMemoryRecallStrategy } from "../memory-recall/default-memory-recall-strategy";
import type { ConversationContinuityRuntime } from "./conversation-continuity-runtime";
import type { MemoryContextEngine } from "./memory-context-engine";

/** User-facing metadata for memory intelligence (Phase 93). */
export const JARVIS_MEMORY_INTELLIGENCE_METADATA_KEY =
  "jarvisMemoryIntelligence" as const;

export interface MemoryIntelligenceSnapshot {
  readonly message: string;
  readonly count: number;
  readonly snippets: readonly string[];
  readonly averageScore: number;
  readonly cacheHit: boolean;
}

function toContextQuery(query: MemoryRecallQuery): ContextQuery {
  return {
    userId: query.userId,
    conversationId: query.conversationId,
    taskId: query.taskId,
    intentDescription: query.intentDescription,
    relevantLimit: query.limit,
  };
}

function fallbackRecall(query: MemoryRecallQuery): MemoryRecallRecord {
  return {
    recallId: `recall-fallback-${Date.now()}`,
    userId: query.userId,
    conversationId: query.conversationId,
    taskId: query.taskId,
    content: query.intentDescription
      ? `No recalled memories for: ${query.intentDescription}`
      : "No recalled memories",
    role: "system",
    score: 0,
    source: "fallback",
    recalledAt: new Date().toISOString(),
  };
}

function dedupeMemories(
  memories: readonly MemoryRecallRecord[],
): readonly MemoryRecallRecord[] {
  const seen = new Set<string>();
  const result: MemoryRecallRecord[] = [];
  for (const memory of memories) {
    const key = memory.content.trim().toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(memory);
  }
  return result;
}

/**
 * Adaptive memory recall with ranking, continuity, and relevance filtering (Phase 93).
 */
export class AdaptiveMemoryRecall implements MemoryRecallRuntime {
  constructor(
    private readonly contextEngine: MemoryContextEngine,
    private readonly continuityRuntime?: ConversationContinuityRuntime,
    private readonly strategy: MemoryRecallStrategy = new DefaultMemoryRecallStrategy(),
    private readonly minScore = 0.35,
    private readonly maxMemories = 5,
  ) {}

  recallMemory(query: MemoryRecallQuery): readonly MemoryRecallRecord[] {
    return this.getRelevantMemories(query);
  }

  getRelevantMemories(query: MemoryRecallQuery): readonly MemoryRecallRecord[] {
    const contextQuery = toContextQuery(query);
    const { ranked, scores, cacheHit } =
      this.contextEngine.buildRankedContext(contextQuery);

    const filteredScores = scores.filter((entry) => entry.score >= this.minScore);
    const limit = query.limit ?? this.maxMemories;

    let memories = this.strategy.selectMemories(
      query,
      ranked,
      filteredScores.length > 0 ? filteredScores : scores,
    );

    memories = dedupeMemories(memories).slice(0, limit);

    if (memories.length === 0) {
      return [fallbackRecall(query)];
    }

    if (this.continuityRuntime && query.conversationId) {
      const top = memories[0];
      this.continuityRuntime.registerTurn({
        userId: query.userId,
        conversationId: query.conversationId,
        taskId: query.taskId ?? top?.taskId,
        message: top?.content ?? query.intentDescription ?? "",
      });
    }

    void cacheHit;
    return memories;
  }

  injectMemoryContext(
    query: MemoryRecallQuery,
    agentContext: AgentContext,
    contextRecord: ContextRecord,
  ): AgentContext {
    const memories = this.recallMemory(query);
    const historyMemories = memories.filter(
      (memory) => memory.source === "conversation-history",
    );
    const hasHistory = historyMemories.length > 0;

    const averageScore =
      historyMemories.length > 0
        ? historyMemories.reduce((sum, memory) => sum + memory.score, 0) /
          historyMemories.length
        : 0;

    const intelligence: MemoryIntelligenceSnapshot = {
      message: hasHistory ? "Remembered context" : "No prior context",
      count: historyMemories.length,
      snippets: historyMemories.slice(0, 3).map((memory) => memory.content),
      averageScore,
      cacheHit: false,
    };

    const enrichedContext: ContextRecord = {
      ...contextRecord,
      summary: hasHistory
        ? `${contextRecord.summary} | Remembered ${historyMemories.length} relevant item(s)`
        : contextRecord.summary,
    };

    return {
      ...agentContext,
      metadata: {
        ...agentContext.metadata,
        [JARVIS_CONTEXT_METADATA_KEY]: enrichedContext,
        [JARVIS_MEMORY_RECALL_METADATA_KEY]: memories,
        [JARVIS_MEMORY_INTELLIGENCE_METADATA_KEY]: intelligence,
      },
    };
  }
}
