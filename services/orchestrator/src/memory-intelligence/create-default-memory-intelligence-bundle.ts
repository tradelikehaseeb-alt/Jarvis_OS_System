import type { LocalMemoryRuntime } from "@jarvis/local-memory";

import type { ConversationHistoryRuntime } from "../conversation-history";
import { createDefaultConversationHistoryRuntime } from "../conversation-history";
import type { ContextRuntime } from "../context/context-runtime";
import {
  createDefaultContextRuntime,
  type DefaultContextRuntimeOptions,
} from "../context/create-default-context-runtime";
import type { ContextRankingRuntime } from "../context/context-ranking-runtime";
import type { MemoryRecallRuntime } from "../memory-recall/memory-recall-runtime";
import { AdaptiveContextScorer } from "./adaptive-context-scorer";
import { AdaptiveMemoryRecall } from "./adaptive-memory-recall";
import { ContextRelevanceRanker } from "./context-relevance-ranker";
import { ConversationContinuityRuntime } from "./conversation-continuity-runtime";
import { MemoryContextEngine } from "./memory-context-engine";
import { DefaultContextScorer } from "../context/default-context-scorer";
import { MEMORY_INTELLIGENCE_RELEVANCE_RULES } from "./memory-intelligence-rules";

export interface MemoryIntelligenceBundle {
  readonly contextRuntime: ContextRuntime;
  readonly conversationHistory: ConversationHistoryRuntime;
  readonly contextRankingRuntime: ContextRankingRuntime;
  readonly memoryRecallRuntime: MemoryRecallRuntime;
  readonly memoryContextEngine: MemoryContextEngine;
  readonly contextRelevanceRanker: ContextRelevanceRanker;
  readonly conversationContinuityRuntime: ConversationContinuityRuntime;
  readonly adaptiveMemoryRecall: AdaptiveMemoryRecall;
}

export interface MemoryIntelligenceBundleOptions extends DefaultContextRuntimeOptions {
  readonly localMemoryRuntime?: LocalMemoryRuntime;
  readonly conversationHistory?: ConversationHistoryRuntime;
  readonly minRecallScore?: number;
  readonly maxMemories?: number;
}

/**
 * Wires Phase 93 memory intelligence on top of existing context/recall layers.
 */
export function createDefaultMemoryIntelligenceBundle(
  options?: MemoryIntelligenceBundleOptions,
): MemoryIntelligenceBundle {
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

  const continuityRuntime = new ConversationContinuityRuntime(
    options?.localMemoryRuntime,
  );
  const ranker = new ContextRelevanceRanker(
    new AdaptiveContextScorer(
      new DefaultContextScorer(MEMORY_INTELLIGENCE_RELEVANCE_RULES),
      continuityRuntime,
    ),
  );
  const contextEngine = new MemoryContextEngine(contextRuntime, ranker);
  const adaptiveRecall = new AdaptiveMemoryRecall(
    contextEngine,
    continuityRuntime,
    undefined,
    options?.minRecallScore,
    options?.maxMemories,
  );

  return {
    contextRuntime,
    conversationHistory,
    contextRankingRuntime: ranker,
    memoryRecallRuntime: adaptiveRecall,
    memoryContextEngine: contextEngine,
    contextRelevanceRanker: ranker,
    conversationContinuityRuntime: continuityRuntime,
    adaptiveMemoryRecall: adaptiveRecall,
  };
}
