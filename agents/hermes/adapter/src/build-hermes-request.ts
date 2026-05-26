import type { AgentTask } from "@jarvis/agents-shared";

import type { HermesRequest } from "./hermes-request";

/** Map orchestrator {@link AgentTask} to adapter {@link HermesRequest}. */
export function buildHermesRequest(task: AgentTask): HermesRequest {
  return {
    requestId: task.requestId,
    taskId: task.taskId,
    userId: task.userId,
    intent: task.intent,
    contextRef: undefined,
    correlationId: task.correlationId,
    workflowStepId: task.workflowStepId,
  };
}

/** Map task + runtime context ref to {@link HermesRequest}. */
export function buildHermesRequestWithContext(
  task: AgentTask,
  contextRef: string,
): HermesRequest {
  return {
    ...buildHermesRequest(task),
    contextRef,
  };
}
