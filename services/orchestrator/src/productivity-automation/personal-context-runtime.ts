export interface PersonalPreference {
  readonly key: string;
  readonly value: string;
  readonly updatedAt: string;
}

export interface PersonalContextSnapshot {
  readonly userId: string;
  readonly conversationId?: string;
  readonly preferences: readonly PersonalPreference[];
  readonly dailyFocus?: string;
  readonly projectNotes: readonly string[];
  readonly updatedAt: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Maintains daily personal context and work preferences (Phase 98).
 */
export class PersonalContextRuntime {
  private readonly snapshots = new Map<string, PersonalContextSnapshot>();

  private key(userId: string, conversationId?: string): string {
    return `${userId}:${conversationId ?? "default"}`;
  }

  getOrCreate(userId: string, conversationId?: string): PersonalContextSnapshot {
    const id = this.key(userId, conversationId);
    const existing = this.snapshots.get(id);
    if (existing) {
      return existing;
    }
    const snapshot: PersonalContextSnapshot = {
      userId,
      conversationId,
      preferences: [],
      projectNotes: [],
      updatedAt: nowIso(),
    };
    this.snapshots.set(id, snapshot);
    return snapshot;
  }

  rememberProjectDirection(
    userId: string,
    note: string,
    conversationId?: string,
  ): PersonalContextSnapshot {
    const snapshot = this.getOrCreate(userId, conversationId);
    const updated: PersonalContextSnapshot = {
      ...snapshot,
      projectNotes: [...snapshot.projectNotes, note.trim()].slice(-20),
      updatedAt: nowIso(),
    };
    this.snapshots.set(this.key(userId, conversationId), updated);
    return updated;
  }

  setDailyFocus(userId: string, focus: string, conversationId?: string): PersonalContextSnapshot {
    const snapshot = this.getOrCreate(userId, conversationId);
    const updated: PersonalContextSnapshot = {
      ...snapshot,
      dailyFocus: focus.trim(),
      updatedAt: nowIso(),
    };
    this.snapshots.set(this.key(userId, conversationId), updated);
    return updated;
  }

  setPreference(
    userId: string,
    key: string,
    value: string,
    conversationId?: string,
  ): PersonalContextSnapshot {
    const snapshot = this.getOrCreate(userId, conversationId);
    const preferences = snapshot.preferences.filter((entry) => entry.key !== key);
    preferences.push({ key, value, updatedAt: nowIso() });
    const updated: PersonalContextSnapshot = {
      ...snapshot,
      preferences,
      updatedAt: nowIso(),
    };
    this.snapshots.set(this.key(userId, conversationId), updated);
    return updated;
  }
}

export function createDefaultPersonalContextRuntime(): PersonalContextRuntime {
  return new PersonalContextRuntime();
}
