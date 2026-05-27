/**
 * Query for building agent execution context (Phase 64).
 */
export interface ContextQuery {
  readonly userId: string;
  readonly conversationId?: string;
  readonly taskId?: string;
  readonly intentDescription?: string;
  readonly recentLimit?: number;
  readonly relevantLimit?: number;
}
