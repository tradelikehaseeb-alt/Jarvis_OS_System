import type { AgentResponse, TaskResult } from "@jarvis/types";

import type {
  ExecutionManager,
  ExecutionManagerResult,
  ExecutionManagerStartInput,
  ExecutionManagerWorkflowInput,
  ExecutionStatus,
} from "./contract";
import type { WorkflowExecutionResult } from "../internal/workflow-execution";

/** Legacy static execution manager — test-only. */
export class ExecutionManagerStub implements ExecutionManager {
  readonly componentId = "execution-manager" as const;

  async start(input: ExecutionManagerStartInput): Promise<ExecutionManagerResult> {
    const { handle, agentRequest } = input;
    const taskId = agentRequest.task.id;

    const agentResponse: AgentResponse = {
      requestId: agentRequest.requestId,
      agentId: agentRequest.agentId,
      success: true,
      payload: { stub: true, stepId: handle.step.stepId },
    };

    const taskResult: TaskResult = {
      taskId,
      status: "running",
      output: { stub: true, executionId: handle.executionId },
    };

    return { handle, agentResponse, taskResult };
  }

  async executeWorkflow(
    _input: ExecutionManagerWorkflowInput,
  ): Promise<WorkflowExecutionResult> {
    return {
      workflowId: "wf-stub",
      success: true,
      stepsCompleted: 0,
      stepResults: [],
      message: "stub workflow (no execution)",
    };
  }

  async getStatus(_taskId: string): Promise<ExecutionStatus | undefined> {
    return undefined;
  }
}
