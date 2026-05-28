export interface PersistedBrowserSession {
  readonly sessionId: string;
  readonly url?: string;
  readonly title?: string;
  readonly active: boolean;
  readonly stub: boolean;
  readonly lastUsedAt: string;
  readonly createdAt: string;
}

export interface BrowserSessionPersistenceOptions {
  readonly maxSessions?: number;
  readonly idleTtlMs?: number;
}

const DEFAULT_MAX_SESSIONS = 4;
const DEFAULT_IDLE_TTL_MS = 30 * 60_000;

/**
 * In-memory browser session reuse with idle cleanup (Phase 95).
 */
export class BrowserSessionPersistence {
  private readonly sessions = new Map<string, PersistedBrowserSession>();
  private readonly maxSessions: number;
  private readonly idleTtlMs: number;

  constructor(options: BrowserSessionPersistenceOptions = {}) {
    this.maxSessions = options.maxSessions ?? DEFAULT_MAX_SESSIONS;
    this.idleTtlMs = options.idleTtlMs ?? DEFAULT_IDLE_TTL_MS;
  }

  save(session: PersistedBrowserSession): PersistedBrowserSession {
    this.cleanupIdle();
    this.sessions.set(session.sessionId, session);
    this.enforceCapacity();
    return session;
  }

  get(sessionId: string): PersistedBrowserSession | undefined {
    return this.sessions.get(sessionId);
  }

  findReusable(url: string | undefined, stub: boolean): PersistedBrowserSession | undefined {
    this.cleanupIdle();
    if (!url) {
      return undefined;
    }
    for (const session of this.sessions.values()) {
      if (session.active && session.stub === stub && session.url === url) {
        return session;
      }
    }
    return undefined;
  }

  deactivate(sessionId: string): void {
    const existing = this.sessions.get(sessionId);
    if (existing) {
      this.sessions.set(sessionId, { ...existing, active: false });
    }
  }

  listActive(): readonly PersistedBrowserSession[] {
    this.cleanupIdle();
    return [...this.sessions.values()].filter((session) => session.active);
  }

  cleanupIdle(nowMs = Date.now()): number {
    let removed = 0;
    for (const [id, session] of this.sessions.entries()) {
      const idleMs = nowMs - Date.parse(session.lastUsedAt);
      if (!session.active || idleMs > this.idleTtlMs) {
        this.sessions.delete(id);
        removed += 1;
      }
    }
    return removed;
  }

  private enforceCapacity(): void {
    if (this.sessions.size <= this.maxSessions) {
      return;
    }
    const sorted = [...this.sessions.values()].sort(
      (a, b) => Date.parse(a.lastUsedAt) - Date.parse(b.lastUsedAt),
    );
    while (this.sessions.size > this.maxSessions && sorted.length > 0) {
      const oldest = sorted.shift();
      if (oldest) {
        this.sessions.delete(oldest.sessionId);
      }
    }
  }
}

export function createDefaultBrowserSessionPersistence(
  options?: BrowserSessionPersistenceOptions,
): BrowserSessionPersistence {
  return new BrowserSessionPersistence(options);
}
