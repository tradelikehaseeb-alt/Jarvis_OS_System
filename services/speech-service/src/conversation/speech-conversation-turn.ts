/**
 * Immutable conversation turn model for user/assistant speech flow (Phase 33).
 */
export interface SpeechConversationTurn {
  readonly turnId: string;
  readonly role: "user" | "assistant";
  readonly text: string;
  readonly at: string;
}
