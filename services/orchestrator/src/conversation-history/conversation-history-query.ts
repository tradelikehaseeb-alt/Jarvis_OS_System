/**
 * Query filters for conversation history retrieval (Phase 63).
 */
export interface ConversationHistoryQuery {
  readonly userId: string;
  readonly conversationId?: string;
  readonly taskId?: string;
  readonly limit?: number;
}
