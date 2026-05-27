import type { AgentTask } from "@jarvis/agents-shared";

import type { OpenClawGatewayRequest } from "./openclaw-gateway-request";

/** Map orchestrator {@link AgentTask} to gateway {@link OpenClawGatewayRequest}. */
export function buildOpenClawGatewayRequest(
  task: AgentTask,
  contextRef: string,
  requestedActions: readonly string[] = ["browser", "file"],
): OpenClawGatewayRequest {
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
