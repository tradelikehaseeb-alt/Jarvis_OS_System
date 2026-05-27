import type { LocalMemoryType } from "./local-memory-record";

/**
 * Query filters for local memory retrieval (Phase 62).
 */
export interface LocalMemoryQuery {
  readonly userId: string;
  readonly types?: readonly LocalMemoryType[];
  readonly taskId?: string;
  readonly sessionId?: string;
  readonly conversationId?: string;
  readonly limit?: number;
}
