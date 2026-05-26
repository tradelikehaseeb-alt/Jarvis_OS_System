import type { SpeechConversation } from "./speech-conversation";
import {
  DEFAULT_SPEECH_CONVERSATION_CONTEXT,
  type SpeechConversationContext,
} from "./speech-conversation-context";
import type { SpeechConversationManager } from "./speech-conversation-manager";
import type { SpeechConversationState } from "./speech-conversation-state";
import type { SpeechConversationTurn } from "./speech-conversation-turn";
import type { SpeechInterruptionEvent } from "./speech-interruption-event";

const FIXED_TIMESTAMP = new Date(0).toISOString();

function appendTurn(
  base: SpeechConversation,
  role: SpeechConversationTurn["role"],
  text: string,
  turnSequence: number,
): SpeechConversation {
  const turn: SpeechConversationTurn = {
    turnId: `speech-turn-${turnSequence}`,
    role,
    text,
    at: FIXED_TIMESTAMP,
  };
  return {
    ...base,
    turns: [...base.turns, turn],
    updatedAt: FIXED_TIMESTAMP,
  };
}

function updateState(
  base: SpeechConversation,
  state: SpeechConversationState,
): SpeechConversation {
  return {
    ...base,
    state,
    updatedAt: FIXED_TIMESTAMP,
  };
}

/**
 * Deterministic in-memory conversation manager (Phase 33).
 */
export class InMemorySpeechConversationManager implements SpeechConversationManager {
  private readonly conversations = new Map<string, SpeechConversation>();
  private conversationSequence = 0;
  private turnSequence = 0;
  private interruptionSequence = 0;

  createConversation(
    conversationId?: string,
    context: Partial<SpeechConversationContext> = {},
  ): SpeechConversation {
    const id = conversationId ?? `speech-conversation-${++this.conversationSequence}`;
    const existing = this.conversations.get(id);
    if (existing) {
      return existing;
    }
    const created: SpeechConversation = {
      conversationId: id,
      state: "active",
      turns: [],
      interruptions: [],
      context: {
        locale: context.locale ?? DEFAULT_SPEECH_CONVERSATION_CONTEXT.locale,
        domain: context.domain ?? DEFAULT_SPEECH_CONVERSATION_CONTEXT.domain,
        metadata: {
          ...DEFAULT_SPEECH_CONVERSATION_CONTEXT.metadata,
          ...(context.metadata ?? {}),
        },
      },
      createdAt: FIXED_TIMESTAMP,
      updatedAt: FIXED_TIMESTAMP,
    };
    this.conversations.set(id, created);
    return created;
  }

  appendUserTurn(conversationId: string, text: string): SpeechConversation {
    const current = this.requireConversation(conversationId);
    const updated = appendTurn(current, "user", text, ++this.turnSequence);
    this.conversations.set(conversationId, updated);
    return updated;
  }

  appendAssistantTurn(conversationId: string, text: string): SpeechConversation {
    const current = this.requireConversation(conversationId);
    const updated = appendTurn(current, "assistant", text, ++this.turnSequence);
    this.conversations.set(conversationId, updated);
    return updated;
  }

  getConversation(conversationId: string): SpeechConversation | undefined {
    return this.conversations.get(conversationId);
  }

  interruptConversation(conversationId: string, reason: string): SpeechConversation {
    const current = this.requireConversation(conversationId);
    const interruption: SpeechInterruptionEvent = {
      interruptionId: `speech-interruption-${++this.interruptionSequence}`,
      reason,
      at: FIXED_TIMESTAMP,
    };
    const updated = updateState(
      {
        ...current,
        interruptions: [...current.interruptions, interruption],
      },
      "interrupted",
    );
    this.conversations.set(conversationId, updated);
    return updated;
  }

  resumeConversation(conversationId: string): SpeechConversation {
    const current = this.requireConversation(conversationId);
    const updated = updateState(current, "active");
    this.conversations.set(conversationId, updated);
    return updated;
  }

  endConversation(conversationId: string): SpeechConversation {
    const current = this.requireConversation(conversationId);
    const updated: SpeechConversation = {
      ...updateState(current, "completed"),
      endedAt: FIXED_TIMESTAMP,
    };
    this.conversations.set(conversationId, updated);
    return updated;
  }

  private requireConversation(conversationId: string): SpeechConversation {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Speech conversation not found: ${conversationId}`);
    }
    return conversation;
  }
}
