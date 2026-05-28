import {
  DEFAULT_CONTEXT_RELEVANCE_RULES,
  INTENT_KEYWORD_RULE,
  RECENCY_RULE,
  TASK_ID_RULE,
} from "../context/default-context-relevance-rules";
import type { ContextRelevanceRule } from "../context/context-relevance-rule";
import { memoryDecayFactor, semanticOverlapScore } from "./memory-decay";

/** Execution intent overlap — boosts turns from automate/plan tasks (Phase 93). */
export const EXECUTION_RELEVANCE_RULE: ContextRelevanceRule = {
  ruleId: "execution-relevance",
  weight: 2.5,
  description: "Boost turns tied to execution-oriented intents",
  apply(query, turn) {
    const executionKinds = new Set(["automate", "plan"]);
    const queryKind = query.intentDescription?.toLowerCase() ?? "";
    const turnKind = turn.intentKind?.toLowerCase() ?? "";
    if (!turnKind) {
      return 0;
    }
    const queryLooksExecution =
      executionKinds.has(turnKind) ||
      queryKind.includes("automate") ||
      queryKind.includes("plan");
    return queryLooksExecution && executionKinds.has(turnKind) ? 1 : 0;
  },
};

/** Conversation continuity — same task or active thread (Phase 93). */
export const CONVERSATION_CONTINUITY_RULE: ContextRelevanceRule = {
  ruleId: "conversation-continuity",
  weight: 2,
  description: "Boost turns from the active conversation thread",
  apply(query, turn) {
    if (query.taskId && turn.taskId && query.taskId === turn.taskId) {
      return 1;
    }
    if (query.conversationId && turn.message.length > 0) {
      return 0.55;
    }
    return 0;
  },
};

/** Enhanced semantic overlap beyond keyword rules (Phase 93). */
export const SEMANTIC_RELEVANCE_RULE: ContextRelevanceRule = {
  ruleId: "semantic-relevance",
  weight: 3.5,
  description: "Semantic word overlap between intent and turn",
  apply(query, turn) {
    if (!query.intentDescription) {
      return 0;
    }
    return semanticOverlapScore(query.intentDescription, turn.message);
  },
};

/** Memory decay — penalizes stale turns (Phase 93). */
export const MEMORY_DECAY_RULE: ContextRelevanceRule = {
  ruleId: "memory-decay",
  weight: 2,
  description: "Reduce score for stale conversation turns",
  apply(_query, turn) {
    return memoryDecayFactor(turn.timestamp);
  },
};

/** Phase 93 intelligence rules layered on Phase 65 defaults. */
export const MEMORY_INTELLIGENCE_RELEVANCE_RULES: readonly ContextRelevanceRule[] = [
  ...DEFAULT_CONTEXT_RELEVANCE_RULES,
  EXECUTION_RELEVANCE_RULE,
  CONVERSATION_CONTINUITY_RULE,
  SEMANTIC_RELEVANCE_RULE,
  MEMORY_DECAY_RULE,
];

export {
  INTENT_KEYWORD_RULE,
  RECENCY_RULE,
  TASK_ID_RULE,
  DEFAULT_CONTEXT_RELEVANCE_RULES,
};
