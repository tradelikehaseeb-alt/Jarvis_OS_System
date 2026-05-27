import type { ContextScorer } from "./context-scorer";
import type { ContextRankingRuntime } from "./context-ranking-runtime";
import { DefaultContextRankingRuntime } from "./default-context-ranking-runtime";

export interface DefaultContextRankingRuntimeOptions {
  readonly scorer?: ContextScorer;
  readonly maxTurns?: number;
}

/**
 * Factory for default context ranking runtime (Phase 65).
 */
export function createDefaultContextRankingRuntime(
  options?: DefaultContextRankingRuntimeOptions,
): ContextRankingRuntime {
  return new DefaultContextRankingRuntime(
    options?.scorer,
    options?.maxTurns,
  );
}
