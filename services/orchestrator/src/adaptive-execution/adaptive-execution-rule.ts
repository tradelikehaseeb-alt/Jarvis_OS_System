/** When an adaptive rule should be evaluated (Phase 78). */
export type AdaptiveExecutionRuleTrigger =
  | "step_succeeded"
  | "step_failed"
  | "always";

/** Action taken when a rule matches (Phase 78). */
export type AdaptiveExecutionRuleAction =
  | "continue"
  | "retry"
  | "modify_plan"
  | "abort";

/**
 * Rule that adapts task chain execution based on step results (Phase 78).
 */
export interface AdaptiveExecutionRule {
  readonly ruleId: string;
  readonly when: AdaptiveExecutionRuleTrigger;
  readonly action: AdaptiveExecutionRuleAction;
  readonly maxRetries?: number;
  /** Replacement step labels when {@link action} is `modify_plan`. */
  readonly modifySteps?: readonly string[];
}

export const DEFAULT_STUB_ADAPTIVE_RULES: readonly AdaptiveExecutionRule[] = [
  {
    ruleId: "stub-continue-on-success",
    when: "step_succeeded",
    action: "continue",
  },
  {
    ruleId: "stub-retry-on-failure",
    when: "step_failed",
    action: "retry",
    maxRetries: 1,
  },
  {
    ruleId: "stub-abort-on-persistent-failure",
    when: "step_failed",
    action: "abort",
  },
];
