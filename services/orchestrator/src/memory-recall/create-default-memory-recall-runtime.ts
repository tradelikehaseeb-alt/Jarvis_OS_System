import type { ContextRankingRuntime } from "../context/context-ranking-runtime";
import type { ContextRuntime } from "../context/context-runtime";
import { createDefaultContextRankingRuntime } from "../context/create-default-context-ranking-runtime";
import { createDefaultContextRuntime } from "../context/create-default-context-runtime";
import { DefaultMemoryRecallRuntime } from "./default-memory-recall-runtime";
import type { MemoryRecallRuntime } from "./memory-recall-runtime";
import type { MemoryRecallStrategy } from "./memory-recall-strategy";

export interface DefaultMemoryRecallRuntimeOptions {
  readonly contextRuntime?: ContextRuntime;
  readonly contextRankingRuntime?: ContextRankingRuntime;
  readonly strategy?: MemoryRecallStrategy;
  readonly maxMemories?: number;
}

/**
 * Factory for default memory recall runtime (Phase 66).
 */
export function createDefaultMemoryRecallRuntime(
  options?: DefaultMemoryRecallRuntimeOptions,
): MemoryRecallRuntime {
  const contextRuntime =
    options?.contextRuntime ?? createDefaultContextRuntime();
  const contextRankingRuntime =
    options?.contextRankingRuntime ?? createDefaultContextRankingRuntime();

  return new DefaultMemoryRecallRuntime(
    contextRuntime,
    contextRankingRuntime,
    options?.strategy,
    options?.maxMemories,
  );
}
