export type WorkforceSessionState = "idle" | "active" | "paused" | "completed" | "failed";

export interface PersistentAgentSessionRecord {
  readonly sessionId: string;
  readonly userId: string;
  readonly conversationId?: string;
  readonly workerTypes: readonly string[];
  readonly state: WorkforceSessionState;
  readonly sharedContextRef?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastProgressAt?: string;
}

/**
 * In-memory persistent agent session with shared context reference (Phase 97).
 */
export class PersistentAgentSession {
  private readonly sessions = new Map<string, PersistentAgentSessionRecord>();

  create(input: {
    userId: string;
    conversationId?: string;
    workerTypes: readonly string[];
    sharedContextRef?: string;
  }): PersistentAgentSessionRecord {
    const now = new Date().toISOString();
    const session: PersistentAgentSessionRecord = {
      sessionId: `workforce-session-${Date.now()}`,
      userId: input.userId,
      conversationId: input.conversationId,
      workerTypes: input.workerTypes,
      state: "active",
      sharedContextRef: input.sharedContextRef,
      createdAt: now,
      updatedAt: now,
      lastProgressAt: now,
    };
    this.sessions.set(session.sessionId, session);
    return session;
  }

  get(sessionId: string): PersistentAgentSessionRecord | undefined {
    return this.sessions.get(sessionId);
  }

  touchProgress(sessionId: string): PersistentAgentSessionRecord | undefined {
    const existing = this.sessions.get(sessionId);
    if (!existing) {
      return undefined;
    }
    const updated: PersistentAgentSessionRecord = {
      ...existing,
      updatedAt: new Date().toISOString(),
      lastProgressAt: new Date().toISOString(),
    };
    this.sessions.set(sessionId, updated);
    return updated;
  }

  complete(sessionId: string, success: boolean): PersistentAgentSessionRecord | undefined {
    const existing = this.sessions.get(sessionId);
    if (!existing) {
      return undefined;
    }
    const updated: PersistentAgentSessionRecord = {
      ...existing,
      state: success ? "completed" : "failed",
      updatedAt: new Date().toISOString(),
    };
    this.sessions.set(sessionId, updated);
    return updated;
  }

  listActive(): readonly PersistentAgentSessionRecord[] {
    return [...this.sessions.values()].filter((session) => session.state === "active");
  }

  cleanupInactive(idleMs = 30 * 60_000): number {
    const now = Date.now();
    let removed = 0;
    for (const [id, session] of this.sessions.entries()) {
      const idleSince = Date.parse(session.lastProgressAt ?? session.updatedAt);
      if (session.state !== "active" || now - idleSince > idleMs) {
        this.sessions.delete(id);
        removed += 1;
      }
    }
    return removed;
  }
}

export function createDefaultPersistentAgentSession(): PersistentAgentSession {
  return new PersistentAgentSession();
}
