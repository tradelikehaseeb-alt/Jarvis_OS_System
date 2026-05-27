import type { MemoryType } from "./memory-type";

/**
 * Persisted memory record — conversation, execution, activity, or summary (Phase 46).
 */
export interface MemoryRecord {
  readonly recordId: string;
  readonly type: MemoryType;
  readonly userId: string;
  readonly timestamp: string;
  readonly taskId?: string;
  readonly sessionId?: string;
  readonly conversationId?: string;
  readonly content: Readonly<Record<string, unknown>>;
}
