export interface ProactiveSuggestion {
  readonly suggestionId: string;
  readonly message: string;
  readonly kind: "priority" | "follow-up" | "reminder";
}

export interface DailyAssistantSession {
  readonly sessionId: string;
  readonly userId: string;
  readonly startedAt: string;
  readonly lastActiveAt: string;
  readonly suggestions: readonly ProactiveSuggestion[];
}

function nowIso(): string {
  return new Date().toISOString();
}

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Continuous daily assistance with proactive suggestions (Phase 98).
 */
export class DailyAssistantRuntime {
  private readonly sessions = new Map<string, DailyAssistantSession>();

  startSession(userId: string): DailyAssistantSession {
    const session: DailyAssistantSession = {
      sessionId: nextId("daily"),
      userId,
      startedAt: nowIso(),
      lastActiveAt: nowIso(),
      suggestions: [],
    };
    this.sessions.set(session.sessionId, session);
    return session;
  }

  touch(sessionId: string): DailyAssistantSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return undefined;
    }
    const updated = { ...session, lastActiveAt: nowIso() };
    this.sessions.set(sessionId, updated);
    return updated;
  }

  buildSuggestions(description: string): readonly ProactiveSuggestion[] {
    const suggestions: ProactiveSuggestion[] = [];

    if (/\b(email|inbox|unread)\b/i.test(description)) {
      suggestions.push({
        suggestionId: nextId("suggest"),
        message: "Would you like me to draft replies for urgent emails?",
        kind: "follow-up",
      });
    }
    if (/\b(research|brief|news)\b/i.test(description)) {
      suggestions.push({
        suggestionId: nextId("suggest"),
        message: "I can schedule a daily briefing at your preferred time.",
        kind: "reminder",
      });
    }
    if (/\b(organize|priorit|tasks?)\b/i.test(description)) {
      suggestions.push({
        suggestionId: nextId("suggest"),
        message: "Want me to block focus time for your top priority?",
        kind: "priority",
      });
    }

    return suggestions;
  }

  listActiveSessions(): readonly DailyAssistantSession[] {
    return [...this.sessions.values()];
  }
}

export function createDefaultDailyAssistantRuntime(): DailyAssistantRuntime {
  return new DailyAssistantRuntime();
}
