import type { AdaptiveExecutionRule } from "../adaptive-execution";
import type { AdaptiveExecuteResult } from "../adaptive-execution";

import type { ExecutionLearningRecord } from "./execution-learning-record";
import type { LearningSignal } from "./learning-signal";
import type { LearningDecisionRule } from "./learning-decision-rule";

export interface RecordExecutionOutcomeInput {
  readonly userId: string;
  readonly taskId: string;
  readonly intentKind: string;
  readonly adaptiveResult: AdaptiveExecuteResult;
  readonly conversationId?: string;
  readonly sessionId?: string;
}

export interface EvaluateLearningInput {
  readonly userId: string;
  readonly intentKind?: string;
  readonly sampleLimit?: number;
}

export interface ApplyLearningInput {
  readonly baseRules: readonly AdaptiveExecutionRule[];
  readonly signals: readonly LearningSignal[];
  readonly decisionRules?: readonly LearningDecisionRule[];
}

export interface GetLearningInsightsInput {
  readonly userId: string;
  readonly intentKind?: string;
  readonly sampleLimit?: number;
}

export interface LearningInsights {
  readonly userId: string;
  readonly intentKind?: string;
  readonly recordCount: number;
  readonly successRate: number;
  readonly signals: readonly LearningSignal[];
  readonly stub: boolean;
}

/**
 * Execution learning runtime — learns from outcomes to improve decisions (Phase 79).
 */
export interface LearningRuntime {
  recordExecutionOutcome(
    input: RecordExecutionOutcomeInput,
  ): ExecutionLearningRecord;
  evaluateLearning(input: EvaluateLearningInput): readonly LearningSignal[];
  applyLearning(input: ApplyLearningInput): readonly AdaptiveExecutionRule[];
  getLearningInsights(input: GetLearningInsightsInput): LearningInsights;
  queryRecords(input: EvaluateLearningInput): readonly ExecutionLearningRecord[];
}
