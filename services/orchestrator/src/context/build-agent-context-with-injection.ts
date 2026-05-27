import type { AgentContext } from "@jarvis/agents-shared";

import type { ContextQuery } from "./context-query";
import type { ContextRecord } from "./context-record";
import { JARVIS_CONTEXT_METADATA_KEY } from "./context-record";
import type { ContextRuntime } from "./context-runtime";
import type { ContextRankingRuntime } from "./context-ranking-runtime";

export interface BuildAgentContextInput {
  readonly contextRef: string;
  readonly userId: string;
  readonly conversationId: string;
  readonly taskId: string;
  readonly intentDescription: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly contextRuntime?: ContextRuntime;
  readonly contextRankingRuntime?: ContextRankingRuntime;
}

export interface AgentContextInjection {
  readonly agentContext: AgentContext;
  readonly contextRecord: ContextRecord;
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

  return {
    contextRecord,
    agentContext: {
      contextRef: input.contextRef,
      userId: input.userId,
      metadata: {
        ...input.metadata,
        [JARVIS_CONTEXT_METADATA_KEY]: contextRecord,
      },
    },
  };
}
