import type { ConversationHistory } from "./conversation-history";

/**
 * Result envelope for conversation history queries (Phase 63).
 */
export interface ConversationHistoryResult {
  readonly histories: readonly ConversationHistory[];
  readonly totalTurns: number;
  readonly queriedAt: string;
}
