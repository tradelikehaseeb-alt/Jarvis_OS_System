import type { SpeechEventType } from "./speech-event-type";

/**
 * Immutable speech event envelope for deterministic in-memory dispatch (Phase 32).
 */
export interface SpeechEvent {
  readonly eventId: string;
  readonly type: SpeechEventType;
  readonly sessionId: string;
  readonly at: string;
  readonly payload: Readonly<Record<string, string>>;
}
