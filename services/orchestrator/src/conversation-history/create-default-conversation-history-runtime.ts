import {
  createDefaultLocalMemoryRuntime,
  type LocalMemoryRuntime,
} from "@jarvis/local-memory";

import { DefaultConversationHistoryRuntime } from "./default-conversation-history-runtime";
import type { ConversationHistoryRuntime } from "./conversation-history-runtime";

export interface DefaultConversationHistoryRuntimeOptions {
  readonly localMemoryRuntime?: LocalMemoryRuntime;
  readonly filePath?: string;
  readonly useFileBackend?: boolean;
}

/**
 * Factory for default conversation history runtime (Phase 63).
 * Uses {@link LocalMemoryRuntime} with in-memory fallback when file backend is disabled.
 */
export function createDefaultConversationHistoryRuntime(
  options?: DefaultConversationHistoryRuntimeOptions,
): ConversationHistoryRuntime {
  const localMemory =
    options?.localMemoryRuntime ??
    createDefaultLocalMemoryRuntime({
      filePath: options?.filePath,
      useFileBackend: options?.useFileBackend ?? true,
    });

  return new DefaultConversationHistoryRuntime(localMemory);
}
