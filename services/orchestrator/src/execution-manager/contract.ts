import type { AgentContext, AgentTask } from "@jarvis/agents-shared";
import type {
  AgentRequest,
  AgentResponse,
  TaskResult,
  UserTask,
  WorkflowStep,
} from "@jarvis/types";

import type { Workflow } from "../workflow-manager/contract";
import type { WorkflowExecutionResult } from "../internal/workflow-execution";

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

/** Persisted execution status for a task/workflow step. */
export interface ExecutionStatus {
  readonly taskId: string;
  readonly executionId: string;
  readonly status: "pending" | "running" | "completed" | "failed";
  readonly startedAt: string;
  readonly endedAt?: string;
  readonly agentId?: string;
  readonly stepId?: string;
  readonly workflowId?: string;
  readonly error?: { readonly code: string; readonly message: string };
}

export interface ExecutionManagerWorkflowInput {
  readonly workflow: Workflow;
  readonly task: UserTask;
  readonly requestId: string;
  readonly agentContext: AgentContext;
}

/**
 * Manages step execution lifecycle and agent dispatch.
 */
export interface ExecutionManager {
  readonly componentId: "execution-manager";
  start(input: ExecutionManagerStartInput): Promise<ExecutionManagerResult>;
  executeWorkflow(
    input: ExecutionManagerWorkflowInput,
  ): Promise<WorkflowExecutionResult>;
  getStatus(taskId: string): Promise<ExecutionStatus | undefined>;
}
