import type { AgentTask } from "@jarvis/agents-shared";

import type { OpenClawRequest } from "./openclaw-request";

/** Map orchestrator {@link AgentTask} to adapter {@link OpenClawRequest}. */
export function buildOpenClawRequest(
  task: AgentTask,
  contextRef: string,
  requestedActions: readonly string[] = ["browser", "file"],
): OpenClawRequest {
  return {
    requestId: task.requestId,
    taskId: task.taskId,
    userId: task.userId,
    intent: task.intent,
    contextRef,
    correlationId: task.correlationId,
    workflowStepId: task.workflowStepId,
    requestedActions,
  };
}
