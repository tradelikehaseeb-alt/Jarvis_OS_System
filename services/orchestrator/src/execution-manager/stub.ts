import type {
  AgentResponse,
  TaskResult,
} from "@jarvis/types";

import type {
  ExecutionManager,
  ExecutionManagerResult,
  ExecutionManagerStartInput,
} from "./contract";

/**
 * Returns static execution results — no agent or OpenClaw calls (Phase 4).
 */
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

    return {
      handle,
      agentResponse,
      taskResult,
    };
  }
}
