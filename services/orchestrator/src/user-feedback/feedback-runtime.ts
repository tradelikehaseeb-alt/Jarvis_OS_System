import type { AdaptiveExecutionRule } from "../adaptive-execution";
import type { LearningRuntime } from "../execution-learning";

import type { FeedbackSignal } from "./feedback-signal";
import type { UserFeedbackRecord, UserFeedbackRating } from "./user-feedback-record";

export interface RecordFeedbackInput {
  readonly userId: string;
  readonly taskId: string;
  readonly rating: UserFeedbackRating;
  readonly comment?: string;
  readonly intentKind?: string;
  readonly executionSuccess?: boolean;
  readonly conversationId?: string;
  readonly sessionId?: string;
  readonly stub?: boolean;
}

export interface EvaluateFeedbackInput {
  readonly userId: string;
  readonly intentKind?: string;
  readonly sampleLimit?: number;
}

export interface ApplyFeedbackInput {
  readonly baseRules: readonly AdaptiveExecutionRule[];
  readonly signals: readonly FeedbackSignal[];
}

export interface GenerateInsightsInput {
  readonly userId: string;
  readonly intentKind?: string;
  readonly sampleLimit?: number;
  readonly learningRuntime?: LearningRuntime;
}

/**
 * Aggregated feedback intelligence for task output (Phase 80).
 */
export interface FeedbackInsight {
  readonly userId: string;
  readonly intentKind?: string;
  readonly feedbackCount: number;
  readonly positiveRate: number;
  readonly signals: readonly FeedbackSignal[];
  readonly stub: boolean;
  readonly learningRecordCount?: number;
}

/**
 * User feedback intelligence runtime contract (Phase 80).
 */
export interface FeedbackRuntime {
  recordFeedback(input: RecordFeedbackInput): UserFeedbackRecord;
  evaluateFeedback(input: EvaluateFeedbackInput): readonly FeedbackSignal[];
  generateInsights(input: GenerateInsightsInput): FeedbackInsight;
  applyFeedback(input: ApplyFeedbackInput): readonly AdaptiveExecutionRule[];
  queryRecords(input: EvaluateFeedbackInput): readonly UserFeedbackRecord[];
}
