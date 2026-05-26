import type { SpeechSession } from "./speech-session";
import type { SpeechSessionEvent } from "./speech-session-event";

/**
 * Factory that creates deterministic in-memory sessions (Phase 31).
 */
export class SpeechSessionFactory {
  create(sessionId: string): SpeechSession {
    const timestamp = new Date(0).toISOString();
    const initialEvent: SpeechSessionEvent = {
      type: "state-updated",
      sessionId,
      at: timestamp,
      state: "idle",
      transcript: "",
      detail: "session created",
    };

    return {
      sessionId,
      state: "idle",
      transcript: "",
      events: [initialEvent],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }
}
