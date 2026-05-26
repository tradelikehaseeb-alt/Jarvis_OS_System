import type { SpeechConversation } from "./speech-conversation";
import type { SpeechConversationContext } from "./speech-conversation-context";

/**
 * Conversation manager contract for deterministic speech orchestration (Phase 33).
 */
export interface SpeechConversationManager {
  createConversation(
    conversationId?: string,
    context?: Partial<SpeechConversationContext>,
  ): SpeechConversation;
  appendUserTurn(conversationId: string, text: string): SpeechConversation;
  appendAssistantTurn(conversationId: string, text: string): SpeechConversation;
  getConversation(conversationId: string): SpeechConversation | undefined;
  interruptConversation(conversationId: string, reason: string): SpeechConversation;
  resumeConversation(conversationId: string): SpeechConversation;
  endConversation(conversationId: string): SpeechConversation;
}
