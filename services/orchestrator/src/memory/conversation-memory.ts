/**
 * Conversation turn persisted for cross-session history (Phase 46).
 */
export interface ConversationMemory {
  readonly conversationId: string;
  readonly userId: string;
  readonly turnIndex: number;
  readonly role: "user" | "assistant" | "system";
  readonly message: string;
  readonly taskId?: string;
  readonly intentKind?: string;
  readonly timestamp: string;
}
