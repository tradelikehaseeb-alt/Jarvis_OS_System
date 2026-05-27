import type {
  ConversationHistory,
  SaveConversationInput,
} from "./conversation-history";
import type { ConversationHistoryQuery } from "./conversation-history-query";
import type { ConversationHistoryResult } from "./conversation-history-result";

/**
 * Conversation history retrieval runtime contract (Phase 63).
 */
export interface ConversationHistoryRuntime {
  saveConversation(input: SaveConversationInput): ConversationHistory;
  getConversation(
    conversationId: string,
    userId: string,
  ): ConversationHistory | undefined;
  queryConversationHistory(
    query: ConversationHistoryQuery,
  ): ConversationHistoryResult;
  getRecentHistory(
    userId: string,
    limit?: number,
  ): readonly ConversationHistory[];
}
