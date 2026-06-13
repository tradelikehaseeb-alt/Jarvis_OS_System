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
  readonly assistantReply?: string;
  readonly detectedIntent?: ChatIntentType;
  readonly hermesPlan?: HermesPlanMessageData;
  /** ISO or HH:MM:SS micro-label for transcript HUD */
  readonly createdAt?: string;
}

export interface ChatMessagesProps {
  readonly messages: readonly ChatMessage[];
  /** True while Jarvis is generating or speaking a reply. */
  readonly responding?: boolean;
}

/**
 * Scrollable chat transcript with motion polish (Phase 92).
 */
export const ChatMessages = memo(function ChatMessages({
  messages,
  responding = false,
}: ChatMessagesProps) {
  const lastMessageId = messages.at(-1)?.id;
  return (
    <div className="chat-messages chat-messages--polished" role="log" aria-live="polite">
      {messages.length === 0 ? (
        <div className="chat-empty-state cc-empty-state">
          <p className="chat-empty-state__title">Jarvis OS</p>
          <p className="chat-empty-state__hint">
            Personal AI operating layer — type a command or use voice.
          </p>
        </div>
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
            <ChatMessageBubble
              message={msg}
              showVoiceWave={
                responding &&
                (msg.role === "loading" ||
                  (msg.role === "assistant" && msg.id === lastMessageId))
              }
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});
