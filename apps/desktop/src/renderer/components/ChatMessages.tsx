import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";

import type { ChatIntentType } from "../intent/intent-types";
import type { HermesPlanMessageData } from "../types/hermes-plan";

import { ChatMessageBubble } from "./ChatMessageBubble";
import { fadeSlideUp, panelTransition } from "../polish/motion-presets";

export type ChatMessageRole = "user" | "assistant" | "loading" | "error";

export interface ChatMessage {
  readonly id: string;
  readonly role: ChatMessageRole;
  readonly text: string;
  readonly detectedIntent?: ChatIntentType;
  readonly hermesPlan?: HermesPlanMessageData;
}

export interface ChatMessagesProps {
  readonly messages: readonly ChatMessage[];
}

/**
 * Scrollable chat transcript with motion polish (Phase 92).
 */
export const ChatMessages = memo(function ChatMessages({ messages }: ChatMessagesProps) {
  return (
    <div className="chat-messages chat-messages--polished" role="log" aria-live="polite">
      {messages.length === 0 ? (
        <p className="chat-empty-state">Ask Jarvis anything — voice or text.</p>
      ) : null}
      <AnimatePresence initial={false}>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            variants={fadeSlideUp}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={panelTransition}
            layout
          >
            <ChatMessageBubble message={msg} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});
