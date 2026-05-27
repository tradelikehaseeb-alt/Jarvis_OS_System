/**
 * Query for memory recall during active conversations (Phase 66).
 */
export interface MemoryRecallQuery {
  readonly userId: string;
  readonly conversationId?: string;
  readonly taskId?: string;
  readonly intentDescription?: string;
  readonly limit?: number;
}
