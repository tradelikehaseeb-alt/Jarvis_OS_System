import type { SpeechSession } from "./speech-session";
import type { SpeechSessionState } from "./speech-session-state";

/**
 * Session orchestrator contract for speech flow (Phase 31).
 */
export interface SpeechSessionManager {
  createSession(sessionId?: string): SpeechSession;
  updateState(
    sessionId: string,
    state: SpeechSessionState,
    detail?: string,
  ): SpeechSession;
  appendTranscript(sessionId: string, chunk: string): SpeechSession;
  getSession(sessionId: string): SpeechSession | undefined;
  endSession(sessionId: string, detail?: string): SpeechSession;
}
