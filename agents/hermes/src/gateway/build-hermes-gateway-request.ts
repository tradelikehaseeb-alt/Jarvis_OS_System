import type { AgentContext, AgentTask } from "@jarvis/agents-shared";

import type { HermesGatewayRequest } from "./hermes-gateway-request";
import { extractRecalledContextFromAgentContext } from "./extract-recalled-context";

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

/** Builds gateway request with recalled context from agent metadata (Phase 93). */
export function buildHermesGatewayRequestWithContext(
  task: AgentTask,
  context: AgentContext,
): HermesGatewayRequest {
  return {
    ...buildHermesGatewayRequest(task, context.contextRef),
    recalledContext: extractRecalledContextFromAgentContext(context),
  };
}
