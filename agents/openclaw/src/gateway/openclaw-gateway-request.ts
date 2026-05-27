import type { TaskIntent } from "@jarvis/types";

/**
 * Gateway execution request — orchestrator/agent → OpenClaw runtime boundary (Phase 42).
 */
export interface OpenClawGatewayRequest {
  readonly requestId: string;
  readonly taskId: string;
  readonly userId: string;
  readonly intent: TaskIntent;
  readonly contextRef?: string;
  readonly correlationId?: string;
  readonly workflowStepId?: string;
  readonly requestedActions?: readonly string[];
}
