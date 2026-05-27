import type { ConversationMemory } from "../memory/conversation-memory";

/**
 * Aggregated conversation history for retrieval (Phase 63).
 */
export interface ConversationHistory {
  readonly conversationId: string;
  readonly userId: string;
  readonly turns: readonly ConversationMemory[];
  readonly turnCount: number;
  readonly startedAt: string;
  readonly updatedAt: string;
}

/** Input for persisting a conversation turn (Phase 63). */
export interface SaveConversationInput {
  readonly conversationId: string;
  readonly userId: string;
  readonly role: ConversationMemory["role"];
  readonly message: string;
  readonly taskId?: string;
  readonly intentKind?: string;
}
