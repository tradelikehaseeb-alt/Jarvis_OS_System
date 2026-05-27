import type { AdaptiveExecutionRuleAction } from "../adaptive-execution";

import type { LearningSignalKind } from "./learning-signal";

/**
 * Rule that maps learning signals to adaptive execution adjustments (Phase 79).
 */
export interface LearningDecisionRule {
  readonly ruleId: string;
  readonly whenSignal: LearningSignalKind;
  readonly adjustMaxRetries?: number;
  readonly preferAction?: AdaptiveExecutionRuleAction;
}

export const DEFAULT_LEARNING_DECISION_RULES: readonly LearningDecisionRule[] = [
  {
    ruleId: "learn-retry-on-elevated-failure",
    whenSignal: "elevated_failure_rate",
    adjustMaxRetries: 2,
    preferAction: "retry",
  },
  {
    ruleId: "learn-retry-recommended",
    whenSignal: "retry_recommended",
    adjustMaxRetries: 2,
    preferAction: "retry",
  },
];
