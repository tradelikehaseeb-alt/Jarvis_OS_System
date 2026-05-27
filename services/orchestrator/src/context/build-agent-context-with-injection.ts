import type { AgentContext } from "@jarvis/agents-shared";

import type { ContextQuery } from "./context-query";
import type { ContextRecord } from "./context-record";
import { JARVIS_CONTEXT_METADATA_KEY } from "./context-record";
import type { ContextRuntime } from "./context-runtime";
import type { ContextRankingRuntime } from "./context-ranking-runtime";
import type { MemoryRecallRuntime } from "../memory-recall/memory-recall-runtime";
import type { MemoryRecallRecord } from "../memory-recall/memory-recall-record";
import { JARVIS_MEMORY_RECALL_METADATA_KEY } from "../memory-recall/memory-recall-record";

export interface BuildAgentContextInput {
  readonly contextRef: string;
  readonly userId: string;
  readonly conversationId: string;
  readonly taskId: string;
  readonly intentDescription: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly contextRuntime?: ContextRuntime;
  readonly contextRankingRuntime?: ContextRankingRuntime;
  readonly memoryRecallRuntime?: MemoryRecallRuntime;
}

export interface AgentContextInjection {
  readonly agentContext: AgentContext;
  readonly contextRecord: ContextRecord;
  readonly recalledMemories: readonly MemoryRecallRecord[];
}

/**
 * Builds agent context with injected conversation history (Phase 64).
 */
export function buildAgentContextWithInjection(
  input: BuildAgentContextInput,
): AgentContextInjection {
  const contextQuery: ContextQuery = {
    userId: input.userId,
    conversationId: input.conversationId,
    taskId: input.taskId,
    intentDescription: input.intentDescription,
  };

  const rawContext = input.contextRuntime
    ? input.contextRuntime.buildContext(contextQuery)
    : {
        contextId: `ctx-fallback-${Date.now()}`,
        userId: input.userId,
        conversationId: input.conversationId,
        taskId: input.taskId,
        intentDescription: input.intentDescription,
        turns: [],
        summary: "No context runtime configured",
        builtAt: new Date().toISOString(),
        source: "fallback" as const,
      };

  const contextRecord = input.contextRankingRuntime
    ? input.contextRankingRuntime.selectRelevantContext(contextQuery, rawContext)
    : rawContext;

  const recallQuery = {
    userId: input.userId,
    conversationId: input.conversationId,
    taskId: input.taskId,
    intentDescription: input.intentDescription,
  };

  let agentContext: AgentContext = {
    contextRef: input.contextRef,
    userId: input.userId,
    metadata: {
      ...input.metadata,
      [JARVIS_CONTEXT_METADATA_KEY]: contextRecord,
    },
  };

  let recalledMemories: AgentContextInjection["recalledMemories"] = [];

  if (input.memoryRecallRuntime) {
    agentContext = input.memoryRecallRuntime.injectMemoryContext(
      recallQuery,
      agentContext,
      contextRecord,
    );
    const injected = agentContext.metadata?.[JARVIS_MEMORY_RECALL_METADATA_KEY];
    recalledMemories = Array.isArray(injected) ? injected : [];
  }

  return {
    contextRecord,
    agentContext,
    recalledMemories,
  };
}
