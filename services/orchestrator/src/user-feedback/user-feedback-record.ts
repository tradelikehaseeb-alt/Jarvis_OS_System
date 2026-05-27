/** Explicit user feedback rating (Phase 80). */
export type UserFeedbackRating = "positive" | "negative" | "neutral";

/**
 * Persisted explicit user feedback tied to an execution (Phase 80).
 */
export interface UserFeedbackRecord {
  readonly recordId: string;
  readonly userId: string;
  readonly taskId: string;
  readonly intentKind?: string;
  readonly rating: UserFeedbackRating;
  readonly comment?: string;
  readonly executionSuccess?: boolean;
  readonly stub: boolean;
  readonly timestamp: string;
  readonly conversationId?: string;
  readonly sessionId?: string;
}

export const USER_FEEDBACK_CONTENT_CATEGORY = "user-feedback" as const;
