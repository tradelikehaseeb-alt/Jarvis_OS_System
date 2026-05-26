/**
 * HTTP body for a conversational turn via the API gateway.
 * Maps to `POST /conversations` or `POST /conversations/{id}/messages` (Phase 4+).
 */
export interface ConversationRequest {
  /** Existing session; omit to start a new conversation. */
  readonly sessionId?: string;
  /** User message content. */
  readonly message: string;
  /** Optional client context (locale, channel, etc.). */
  readonly metadata?: Readonly<Record<string, unknown>>;
}
