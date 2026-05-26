import type { SpeechSessionEvent } from "./speech-session-event";
import type { SpeechSessionState } from "./speech-session-state";

/**
 * In-memory session snapshot model (Phase 31).
 */
export interface SpeechSession {
  readonly sessionId: string;
  readonly state: SpeechSessionState;
  readonly transcript: string;
  readonly events: readonly SpeechSessionEvent[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly endedAt?: string;
}
