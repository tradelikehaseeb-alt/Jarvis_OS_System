import type { AgentRequest, AgentResponse, TaskResult, WorkflowStep } from "@jarvis/types";

/**
 * Tracks execution of a single workflow step (contract only).
 */
export interface ExecutionHandle {
  readonly executionId: string;
  readonly step: WorkflowStep;
}

/**
 * Input to start or resume step execution.
 */
export interface ExecutionManagerStartInput {
  readonly handle: ExecutionHandle;
  readonly agentRequest: AgentRequest;
}

/**
 * Result of a step execution attempt.
 */
export interface ExecutionManagerResult {
  readonly handle: ExecutionHandle;
  readonly agentResponse: AgentResponse;
  readonly taskResult: TaskResult;
}

/**
 * Manages step execution lifecycle and agent dispatch (Phase 2 skeleton).
 */
export interface ExecutionManager {
  readonly componentId: "execution-manager";
  start(input: ExecutionManagerStartInput): Promise<ExecutionManagerResult>;
}
