import type { AgentContext } from "@jarvis/agents-shared";

import type { ContextRecord } from "../context/context-record";
import type { MemoryRecallQuery } from "./memory-recall-query";
import type { MemoryRecallRecord } from "./memory-recall-record";

/**
 * Memory recall runtime contract (Phase 66).
 */
export interface MemoryRecallRuntime {
  recallMemory(query: MemoryRecallQuery): readonly MemoryRecallRecord[];
  getRelevantMemories(query: MemoryRecallQuery): readonly MemoryRecallRecord[];
  injectMemoryContext(
    query: MemoryRecallQuery,
    agentContext: AgentContext,
    contextRecord: ContextRecord,
  ): AgentContext;
}
