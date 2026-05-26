/**
 * HTTP response for a conversational turn.
 */
export interface ConversationResponse {
  readonly sessionId: string;
  /** Assistant reply text (UI-facing Jarvis voice only). */
  readonly reply: string;
  /** Linked task when the turn spawned orchestration. */
  readonly taskId?: string;
  readonly createdAt: string;
}
