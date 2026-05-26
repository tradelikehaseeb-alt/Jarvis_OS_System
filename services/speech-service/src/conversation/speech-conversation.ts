import type { SpeechConversationContext } from "./speech-conversation-context";
import type { SpeechConversationState } from "./speech-conversation-state";
import type { SpeechConversationTurn } from "./speech-conversation-turn";
import type { SpeechInterruptionEvent } from "./speech-interruption-event";

/**
 * In-memory conversation aggregate for speech interactions (Phase 33).
 */
export interface SpeechConversation {
  readonly conversationId: string;
  readonly state: SpeechConversationState;
  readonly turns: readonly SpeechConversationTurn[];
  readonly interruptions: readonly SpeechInterruptionEvent[];
  readonly context: SpeechConversationContext;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly endedAt?: string;
}
