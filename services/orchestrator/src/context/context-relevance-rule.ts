import type { ContextQuery } from "./context-query";
import type { ContextTurn } from "./context-record";

/**
 * Weighted relevance rule for context scoring (Phase 65).
 */
export interface ContextRelevanceRule {
  readonly ruleId: string;
  readonly weight: number;
  readonly description: string;
  apply(
    query: ContextQuery,
    turn: ContextTurn,
    turnIndex: number,
    totalTurns: number,
  ): number;
}
