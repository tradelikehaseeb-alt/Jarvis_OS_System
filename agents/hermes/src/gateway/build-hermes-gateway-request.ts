import type { AgentTask } from "@jarvis/agents-shared";

import type { HermesGatewayRequest } from "./hermes-gateway-request";

/** Map orchestrator {@link AgentTask} to gateway {@link HermesGatewayRequest}. */
export function buildHermesGatewayRequest(
  task: AgentTask,
  contextRef: string,
): HermesGatewayRequest {
  return {
    requestId: task.requestId,
    taskId: task.taskId,
    userId: task.userId,
    intent: task.intent,
    contextRef,
    correlationId: task.correlationId,
    workflowStepId: task.workflowStepId,
  };
}
