/**
 * Persisted execution outcome used for learning (Phase 79).
 */
export interface ExecutionLearningRecord {
  readonly recordId: string;
  readonly userId: string;
  readonly taskId: string;
  readonly intentKind: string;
  readonly success: boolean;
  readonly stepCount: number;
  readonly failureCount: number;
  readonly stub: boolean;
  readonly timestamp: string;
  readonly executionId?: string;
  readonly conversationId?: string;
  readonly sessionId?: string;
}

export const EXECUTION_LEARNING_CONTENT_CATEGORY = "execution-learning" as const;
