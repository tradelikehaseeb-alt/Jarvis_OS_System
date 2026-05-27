import type { AgentContext, AgentResult } from "@jarvis/agents-shared";
import type {
  HermesExecutionPlan,
  HermesOpenClawTaskDescriptor,
} from "@jarvis/hermes";

import type { TaskChainExecuteInput, TaskChainExecuteResult } from "../task-chain";

import type { AdaptiveExecutionDecision } from "./adaptive-execution-decision";
import type { AdaptiveExecutionEvent } from "./adaptive-execution-event";
import type { AdaptiveExecutionRule } from "./adaptive-execution-rule";

export interface AdaptiveExecutionSubscriber {
  readonly subscriberId: string;
  onEvent(event: AdaptiveExecutionEvent): void;
}

export interface EvaluateExecutionInput {
  readonly stepResult: AgentResult;
  readonly descriptor: HermesOpenClawTaskDescriptor;
  readonly stepIndex: number;
  readonly retryCount: number;
  readonly plan: HermesExecutionPlan;
  readonly rules?: readonly AdaptiveExecutionRule[];
}

export interface SelectNextStepInput {
  readonly tasks: readonly HermesOpenClawTaskDescriptor[];
  readonly currentIndex: number;
  readonly decision: AdaptiveExecutionDecision;
}

export interface RetryExecutionInput {
  readonly descriptor: HermesOpenClawTaskDescriptor;
  readonly requestId: string;
  readonly agentContext: AgentContext;
  readonly retryCount: number;
}

export interface ModifyExecutionPlanInput {
  readonly plan: HermesExecutionPlan;
  readonly parentTaskId: string;
  readonly completedStepCount: number;
  readonly newRemainingSteps: readonly string[];
}

export interface AdaptiveExecuteInput extends TaskChainExecuteInput {
  readonly executionId?: string;
  readonly rules?: readonly AdaptiveExecutionRule[];
  /** When true, delegates to fixed {@link TaskChainRuntime.executeTaskChain}. */
  readonly useFixedChain?: boolean;
}

export interface AdaptiveExecuteResult {
  readonly executionId: string;
  readonly success: boolean;
  readonly plan: HermesExecutionPlan;
  readonly tasks: readonly HermesOpenClawTaskDescriptor[];
  readonly executionResults: readonly AgentResult[];
  readonly decisions: readonly AdaptiveExecutionDecision[];
  readonly events: readonly AdaptiveExecutionEvent[];
  readonly taskChainResult?: TaskChainExecuteResult;
  readonly stub: boolean;
  readonly adaptive: true;
}

/**
 * Adaptive task execution runtime — adjusts flow from step results (Phase 78).
 */
export interface AdaptiveExecutionRuntime {
  evaluateExecution(input: EvaluateExecutionInput): AdaptiveExecutionDecision;
  selectNextStep(
    input: SelectNextStepInput,
  ): HermesOpenClawTaskDescriptor | undefined;
  retryExecution(input: RetryExecutionInput): Promise<AgentResult | undefined>;
  modifyExecutionPlan(input: ModifyExecutionPlanInput): HermesExecutionPlan;
  executeAdaptively(input: AdaptiveExecuteInput): Promise<AdaptiveExecuteResult>;
  subscribeAdaptiveExecution(
    subscriber: AdaptiveExecutionSubscriber,
  ): () => void;
  getEvents(executionId: string): readonly AdaptiveExecutionEvent[];
}
