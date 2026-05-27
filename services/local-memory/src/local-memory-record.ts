/**
 * Local memory record categories (Phase 62).
 */
export type LocalMemoryType = "conversation" | "execution" | "activity" | "summary";

/**
 * Persisted local memory record — SQLite-ready shape (Phase 62).
 */
export interface LocalMemoryRecord {
  readonly recordId: string;
  readonly type: LocalMemoryType;
  readonly userId: string;
  readonly timestamp: string;
  readonly taskId?: string;
  readonly sessionId?: string;
  readonly conversationId?: string;
  readonly content: Readonly<Record<string, unknown>>;
  /** Schema version for future SQLite migration. */
  readonly schemaVersion: number;
}
