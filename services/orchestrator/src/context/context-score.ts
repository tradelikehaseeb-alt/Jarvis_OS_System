import type { ContextTurn } from "./context-record";

/**
 * Relevance score for a single context turn (Phase 65).
 */
export interface ContextScore {
  readonly turnIndex: number;
  readonly score: number;
  readonly reason: string;
  readonly turn: ContextTurn;
}
