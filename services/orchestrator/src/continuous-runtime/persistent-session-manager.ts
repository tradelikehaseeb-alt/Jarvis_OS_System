export type PersistentSessionState = "active" | "idle" | "background" | "recovered";

export interface PersistentSessionRecord {
  readonly sessionId: string;
  readonly userId: string;
  readonly conversationId?: string;
  readonly state: PersistentSessionState;
  readonly startedAt: string;
  readonly lastActiveAt: string;
  readonly workflowCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Manages persistent Jarvis sessions with automatic recovery (Phase 99).
 */
export class PersistentSessionManager {
  private readonly sessions = new Map<string, PersistentSessionRecord>();

  create(userId: string, conversationId?: string): PersistentSessionRecord {
    const session: PersistentSessionRecord = {
      sessionId: nextId("jarvis-session"),
      userId,
      conversationId,
      state: "active",
      startedAt: nowIso(),
      lastActiveAt: nowIso(),
      workflowCount: 0,
    };
    this.sessions.set(session.sessionId, session);
    return session;
  }

  touch(sessionId: string, state: PersistentSessionState = "active"): PersistentSessionRecord | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return undefined;
    }
    const updated = { ...session, state, lastActiveAt: nowIso() };
    this.sessions.set(sessionId, updated);
    return updated;
  }

  recover(sessionId: string): PersistentSessionRecord | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return undefined;
    }
    const updated = { ...session, state: "recovered" as const, lastActiveAt: nowIso() };
    this.sessions.set(sessionId, updated);
    return updated;
  }

  incrementWorkflows(sessionId: string): PersistentSessionRecord | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return undefined;
    }
    const updated = {
      ...session,
      workflowCount: session.workflowCount + 1,
      lastActiveAt: nowIso(),
    };
    this.sessions.set(sessionId, updated);
    return updated;
  }

  listActive(): readonly PersistentSessionRecord[] {
    return [...this.sessions.values()].filter(
      (entry) => entry.state === "active" || entry.state === "background",
    );
  }
}

export function createDefaultPersistentSessionManager(): PersistentSessionManager {
  return new PersistentSessionManager();
}
