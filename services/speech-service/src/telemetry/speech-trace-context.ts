/**
 * Common trace context envelope for speech telemetry events (Phase 37).
 */
export interface SpeechTraceContext {
  readonly requestId?: string;
  readonly sessionId?: string;
  readonly conversationId?: string;
  readonly component: string;
  readonly metadata: Readonly<Record<string, string>>;
}
