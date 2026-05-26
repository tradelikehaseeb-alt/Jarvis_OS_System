import type { SpeechSession } from "./speech-session";
import type { SpeechSessionEvent } from "./speech-session-event";
import { SpeechSessionFactory } from "./speech-session-factory";
import type { SpeechSessionManager } from "./speech-session-manager";
import type { SpeechSessionState } from "./speech-session-state";

const FIXED_TIMESTAMP = new Date(0).toISOString();

function nextEvent(
  base: SpeechSession,
  event: SpeechSessionEvent,
  patch: Partial<SpeechSession>,
): SpeechSession {
  return {
    ...base,
    ...patch,
    updatedAt: FIXED_TIMESTAMP,
    events: [...base.events, event],
  };
}

/**
 * In-memory deterministic speech session manager (Phase 31).
 */
export class InMemorySpeechSessionManager implements SpeechSessionManager {
  private readonly sessions = new Map<string, SpeechSession>();
  private readonly factory: SpeechSessionFactory;
  private sequence = 0;

  constructor(factory: SpeechSessionFactory = new SpeechSessionFactory()) {
    this.factory = factory;
  }

  createSession(sessionId?: string): SpeechSession {
    const id = sessionId ?? `speech-session-${++this.sequence}`;
    const existing = this.sessions.get(id);
    if (existing) {
      return existing;
    }
    const created = this.factory.create(id);
    this.sessions.set(id, created);
    return created;
  }

  updateState(
    sessionId: string,
    state: SpeechSessionState,
    detail?: string,
  ): SpeechSession {
    const current = this.requireSession(sessionId);
    const event: SpeechSessionEvent = {
      type: "state-updated",
      sessionId,
      at: FIXED_TIMESTAMP,
      state,
      transcript: current.transcript,
      detail,
    };
    const updated = nextEvent(current, event, { state });
    this.sessions.set(sessionId, updated);
    return updated;
  }

  appendTranscript(sessionId: string, chunk: string): SpeechSession {
    const current = this.requireSession(sessionId);
    const nextTranscript = `${current.transcript}${chunk}`;
    const event: SpeechSessionEvent = {
      type: "transcript-appended",
      sessionId,
      at: FIXED_TIMESTAMP,
      state: current.state,
      transcript: nextTranscript,
      detail: chunk,
    };
    const updated = nextEvent(current, event, { transcript: nextTranscript });
    this.sessions.set(sessionId, updated);
    return updated;
  }

  getSession(sessionId: string): SpeechSession | undefined {
    return this.sessions.get(sessionId);
  }

  endSession(sessionId: string, detail?: string): SpeechSession {
    const current = this.requireSession(sessionId);
    const event: SpeechSessionEvent = {
      type: "session-ended",
      sessionId,
      at: FIXED_TIMESTAMP,
      state: "completed",
      transcript: current.transcript,
      detail,
    };
    const updated = nextEvent(current, event, {
      state: "completed",
      endedAt: FIXED_TIMESTAMP,
    });
    this.sessions.set(sessionId, updated);
    return updated;
  }

  private requireSession(sessionId: string): SpeechSession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Speech session not found: ${sessionId}`);
    }
    return session;
  }
}
