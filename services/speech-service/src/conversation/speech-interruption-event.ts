/**
 * Interruption event recorded in conversation timeline (Phase 33).
 */
export interface SpeechInterruptionEvent {
  readonly interruptionId: string;
  readonly reason: string;
  readonly at: string;
}
