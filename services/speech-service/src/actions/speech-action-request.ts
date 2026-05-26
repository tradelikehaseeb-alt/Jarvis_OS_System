/**
 * Request payload used by speech action router/handlers (Phase 34).
 */
export interface SpeechActionRequest {
  readonly requestId: string;
  readonly transcript: string;
  readonly conversationId?: string;
}
