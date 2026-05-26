/**
 * Conversation-scoped context for speech orchestration (Phase 33).
 *
 * In-memory only for now; no persistence in this phase.
 */
export interface SpeechConversationContext {
  readonly locale: string;
  readonly domain: string;
  readonly metadata: Readonly<Record<string, string>>;
}

export const DEFAULT_SPEECH_CONVERSATION_CONTEXT: SpeechConversationContext = {
  locale: "en",
  domain: "general",
  metadata: {},
};
