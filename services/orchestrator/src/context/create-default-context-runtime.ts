import type { ConversationHistoryRuntime } from "../conversation-history";
import { createDefaultConversationHistoryRuntime } from "../conversation-history";
import type { ContextBuilder } from "./default-context-builder";
import { DefaultContextBuilder } from "./default-context-builder";
import { createDefaultContextRankingRuntime } from "./create-default-context-ranking-runtime";
import type { ContextRankingRuntime } from "./context-ranking-runtime";
import type { ContextQuery } from "./context-query";
import type { ContextRecord } from "./context-record";
import type { ContextRuntime } from "./context-runtime";

/**
 * Default context runtime implementation (Phase 64).
 */
export class DefaultContextRuntime implements ContextRuntime {
  constructor(private readonly builder: ContextBuilder) {}

  buildContext(query: ContextQuery): ContextRecord {
    return this.builder.build(query);
  }

  getRecentContext(query: ContextQuery): ContextRecord {
    return this.builder.getRecent(query);
  }

  getRelevantContext(query: ContextQuery): ContextRecord {
    return this.builder.getRelevant(query);
  }
}

export interface DefaultContextRuntimeOptions {
  readonly conversationHistory?: ConversationHistoryRuntime;
  readonly builder?: ContextBuilder;
  readonly useFileBackend?: boolean;
}

/**
 * Factory for default context runtime with conversation history fallback (Phase 64).
 */
export function createDefaultContextRuntime(
  options?: DefaultContextRuntimeOptions,
): ContextRuntime {
  const conversationHistory =
    options?.conversationHistory ??
    createDefaultConversationHistoryRuntime({
      useFileBackend: options?.useFileBackend ?? false,
    });

  const builder =
    options?.builder ?? new DefaultContextBuilder(conversationHistory);

  return new DefaultContextRuntime(builder);
}

export interface ContextRuntimeBundle {
  readonly contextRuntime: ContextRuntime;
  readonly conversationHistory: ConversationHistoryRuntime;
  readonly contextRankingRuntime: ContextRankingRuntime;
}

/**
 * Creates paired context + conversation history runtimes sharing the same store (Phase 64).
 */
export function createDefaultContextRuntimeBundle(
  options?: DefaultContextRuntimeOptions,
): ContextRuntimeBundle {
  const conversationHistory =
    options?.conversationHistory ??
    createDefaultConversationHistoryRuntime({
      useFileBackend: options?.useFileBackend ?? false,
    });

  return {
    conversationHistory,
    contextRuntime: createDefaultContextRuntime({
      ...options,
      conversationHistory,
    }),
    contextRankingRuntime: createDefaultContextRankingRuntime(),
  };
}
