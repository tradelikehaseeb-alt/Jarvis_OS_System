import type { ChatIntentType } from "../intent/intent-types";
import type { HermesPlanMessageData } from "../types/hermes-plan";

import { ChatMessageBubble } from "./ChatMessageBubble";
export type ChatMessageRole = "user" | "assistant" | "loading" | "error";

export interface ChatMessage {
  readonly id: string;
  readonly role: ChatMessageRole;
  readonly text: string;
  /** Desktop intent classification shown on user messages (Phase 24). */
  readonly detectedIntent?: ChatIntentType;
  /** Present when assistant message includes Hermes structured planning (Phase 23). */
  readonly hermesPlan?: HermesPlanMessageData;
}

export interface ChatMessagesProps {
  readonly messages: readonly ChatMessage[];
}

/**
 * Scrollable chat transcript (Phase 18–24).
 *
 * User messages, Hermes plan cards, loading, and error states.
 */
export function ChatMessages({ messages }: ChatMessagesProps) {
  return (
    <div className="chat-messages" role="log" aria-live="polite">
      {messages.length === 0 ? (
        <p className="chat-bubble assistant">
          Send a message — Jarvis classifies your intent, submits a task, and
          shows a structured action plan when planning applies.
        </p>
      ) : null}
      {messages.map((msg) => (
        <ChatMessageBubble key={msg.id} message={msg} />
      ))}
    </div>
  );
}