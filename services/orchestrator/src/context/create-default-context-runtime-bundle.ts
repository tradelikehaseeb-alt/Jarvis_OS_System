import type { LocalMemoryRuntime } from "@jarvis/local-memory";

import type { ConversationHistoryRuntime } from "../conversation-history";
import { createDefaultConversationHistoryRuntime } from "../conversation-history";
import { createDefaultMemoryRecallRuntime } from "../memory-recall/create-default-memory-recall-runtime";
import type { MemoryRecallRuntime } from "../memory-recall/memory-recall-runtime";
import { createDefaultContextRankingRuntime } from "./create-default-context-ranking-runtime";
import type { ContextRankingRuntime } from "./context-ranking-runtime";
import {
  createDefaultContextRuntime,
  type DefaultContextRuntimeOptions,
} from "./create-default-context-runtime";
import type { ContextRuntime } from "./context-runtime";

export interface ContextRuntimeBundle {
  readonly contextRuntime: ContextRuntime;
  readonly conversationHistory: ConversationHistoryRuntime;
  readonly contextRankingRuntime: ContextRankingRuntime;
  readonly memoryRecallRuntime: MemoryRecallRuntime;
  readonly localMemoryRuntime?: LocalMemoryRuntime;
}

export interface ContextRuntimeBundleOptions extends DefaultContextRuntimeOptions {
  readonly localMemoryRuntime?: LocalMemoryRuntime;
  readonly filePath?: string;
  readonly useFileBackend?: boolean;
}

/**
 * Creates paired context, conversation history, ranking, and recall runtimes (Phase 64, 67).
 */
export function createDefaultContextRuntimeBundle(
  options?: ContextRuntimeBundleOptions,
): ContextRuntimeBundle {
  const conversationHistory =
    options?.conversationHistory ??
    createDefaultConversationHistoryRuntime({
      localMemoryRuntime: options?.localMemoryRuntime,
      filePath: options?.filePath,
      useFileBackend: options?.useFileBackend ?? false,
    });

  const contextRuntime = createDefaultContextRuntime({
    ...options,
    conversationHistory,
    localMemoryRuntime: options?.localMemoryRuntime,
  });
  const contextRankingRuntime = createDefaultContextRankingRuntime();

  return {
    conversationHistory,
    contextRuntime,
    contextRankingRuntime,
    localMemoryRuntime: options?.localMemoryRuntime,
    memoryRecallRuntime: createDefaultMemoryRecallRuntime({
      contextRuntime,
      contextRankingRuntime,
    }),
  };
}
