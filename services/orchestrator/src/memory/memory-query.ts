import type { MemoryType } from "./memory-type";

/**
 * Query filters for memory history retrieval (Phase 46).
 */
export interface MemoryQuery {
  readonly userId: string;
  readonly types?: readonly MemoryType[];
  readonly taskId?: string;
  readonly sessionId?: string;
  readonly conversationId?: string;
  readonly limit?: number;
}

export interface GenerateSummaryInput {
  readonly userId: string;
  readonly taskId?: string;
  readonly conversationId?: string;
}

export interface MemorySummary {
  readonly text: string;
  readonly recordCount: number;
  readonly taskCount: number;
}
