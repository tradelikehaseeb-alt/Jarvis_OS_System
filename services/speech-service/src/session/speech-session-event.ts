import type { SpeechSessionState } from "./speech-session-state";

/**
 * Immutable event emitted when session state/transcript changes (Phase 31).
 */
export interface SpeechSessionEvent {
  readonly type: "state-updated" | "transcript-appended" | "session-ended";
  readonly sessionId: string;
  readonly at: string;
  readonly state: SpeechSessionState;
  readonly transcript: string;
  readonly detail?: string;
}
