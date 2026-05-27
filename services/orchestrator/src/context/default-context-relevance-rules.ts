import type { ContextRelevanceRule } from "./context-relevance-rule";

function extractKeywords(text?: string): string[] {
  if (!text) {
    return [];
  }
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3);
}

/** Intent keyword overlap rule (Phase 65). */
export const INTENT_KEYWORD_RULE: ContextRelevanceRule = {
  ruleId: "intent-keyword-match",
  weight: 3,
  description: "Boost turns whose message overlaps task intent keywords",
  apply(query, turn) {
    const keywords = extractKeywords(query.intentDescription);
    if (keywords.length === 0) {
      return 0;
    }
    const message = turn.message.toLowerCase();
    const matches = keywords.filter((keyword) => message.includes(keyword));
    return matches.length / keywords.length;
  },
};

/** Same task id rule (Phase 65). */
export const TASK_ID_RULE: ContextRelevanceRule = {
  ruleId: "task-id-match",
  weight: 2,
  description: "Boost turns from the same task id",
  apply(query, turn) {
    if (!query.taskId || !turn.taskId) {
      return 0;
    }
    return query.taskId === turn.taskId ? 1 : 0;
  },
};

/** Recency rule — later turns score higher (Phase 65). */
export const RECENCY_RULE: ContextRelevanceRule = {
  ruleId: "recency",
  weight: 1,
  description: "Boost more recent turns",
  apply(_query, _turn, turnIndex, totalTurns) {
    if (totalTurns <= 1) {
      return 1;
    }
    return (turnIndex + 1) / totalTurns;
  },
};

/** Default relevance rules for context scoring (Phase 65). */
export const DEFAULT_CONTEXT_RELEVANCE_RULES: readonly ContextRelevanceRule[] =
  [INTENT_KEYWORD_RULE, TASK_ID_RULE, RECENCY_RULE];
