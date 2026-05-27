import type { AgentContext, AgentResult } from "@jarvis/agents-shared";
import type {
  CreateExecutionPlanInput,
  HermesExecutionBridge,
  HermesExecutionPlan,
  HermesOpenClawTaskDescriptor,
  MapPlanToTasksInput,
} from "@jarvis/hermes";

import type { TaskChainEvent } from "./task-chain-event";

export interface TaskChainSubscriber {
  readonly subscriberId: string;
  onEvent(event: TaskChainEvent): void;
}

export interface TaskChainExecuteInput {
  readonly chainId: string;
  readonly parentTaskId: string;
  readonly requestId: string;
  readonly userId: string;
  readonly correlationId?: string;
  readonly planningResult: AgentResult;
  readonly agentContext: AgentContext;
  readonly sessionId: string;
  readonly timelineId?: string;
}

export interface TaskChainExecuteResult {
  readonly chainId: string;
  readonly success: boolean;
  readonly plan: HermesExecutionPlan;
  readonly tasks: readonly HermesOpenClawTaskDescriptor[];
  readonly events: readonly TaskChainEvent[];
  readonly executionResults: readonly AgentResult[];
  readonly stub: boolean;
}

export interface OpenClawStepExecutor {
  executeStep(
    descriptor: HermesOpenClawTaskDescriptor,
    requestId: string,
    agentContext: AgentContext,
  ): Promise<AgentResult | undefined>;
}

/**
 * Orchestrator runtime for Hermes plan → OpenClaw task chain execution (Phase 77).
 */
export interface TaskChainRuntime {
  createExecutionPlan(input: CreateExecutionPlanInput): HermesExecutionPlan;
  mapPlanToTasks(
    input: MapPlanToTasksInput,
  ): readonly HermesOpenClawTaskDescriptor[];
  executeTaskChain(input: TaskChainExecuteInput): Promise<TaskChainExecuteResult>;
  subscribeTaskChain(subscriber: TaskChainSubscriber): () => void;
  getEvents(chainId: string): readonly TaskChainEvent[];
}
