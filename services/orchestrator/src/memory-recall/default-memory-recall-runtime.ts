import type { AgentContext } from "@jarvis/agents-shared";

import type { ContextQuery } from "../context/context-query";
import type { ContextRecord } from "../context/context-record";
import { JARVIS_CONTEXT_METADATA_KEY } from "../context/context-record";
import type { ContextRankingRuntime } from "../context/context-ranking-runtime";
import type { ContextRuntime } from "../context/context-runtime";
import type { MemoryRecallQuery } from "./memory-recall-query";
import type { MemoryRecallRecord } from "./memory-recall-record";
import { JARVIS_MEMORY_RECALL_METADATA_KEY } from "./memory-recall-record";
import type { MemoryRecallRuntime } from "./memory-recall-runtime";
import type { MemoryRecallStrategy } from "./memory-recall-strategy";
import { DefaultMemoryRecallStrategy } from "./default-memory-recall-strategy";

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

/**
 * Default memory recall runtime using {@link ContextRankingRuntime} (Phase 66).
 */
export class DefaultMemoryRecallRuntime implements MemoryRecallRuntime {
  constructor(
    private readonly contextRuntime: ContextRuntime,
    private readonly contextRankingRuntime: ContextRankingRuntime,
    private readonly strategy: MemoryRecallStrategy = new DefaultMemoryRecallStrategy(),
    private readonly maxMemories = 5,
  ) {}

  recallMemory(query: MemoryRecallQuery): readonly MemoryRecallRecord[] {
    return this.getRelevantMemories(query);
  }

  getRelevantMemories(query: MemoryRecallQuery): readonly MemoryRecallRecord[] {
    const contextQuery = toContextQuery(query);
    const rawContext = this.contextRuntime.buildContext(contextQuery);
    const rankedContext = this.contextRankingRuntime.selectRelevantContext(
      contextQuery,
      rawContext,
      query.limit ?? this.maxMemories,
    );
    const scores = this.contextRankingRuntime.rankContext(contextQuery, rawContext);

    const memories = this.strategy.selectMemories(
      query,
      rankedContext,
      scores,
    );

    if (memories.length === 0) {
      return [fallbackRecall(query)];
    }

    return memories;
  }

  injectMemoryContext(
    query: MemoryRecallQuery,
    agentContext: AgentContext,
    contextRecord: ContextRecord,
  ): AgentContext {
    const memories = this.recallMemory(query);
    const hasHistory = memories.some(
      (memory) => memory.source === "conversation-history",
    );

    const enrichedContext: ContextRecord = {
      ...contextRecord,
      summary: hasHistory
        ? `${contextRecord.summary} | Recalled ${memories.length} memory item(s)`
        : contextRecord.summary,
    };

    return {
      ...agentContext,
      metadata: {
        ...agentContext.metadata,
        [JARVIS_CONTEXT_METADATA_KEY]: enrichedContext,
        [JARVIS_MEMORY_RECALL_METADATA_KEY]: memories,
      },
    };
  }
}
