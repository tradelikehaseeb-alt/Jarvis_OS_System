import type { TaskIntent } from "@jarvis/types";

/**
 * Gateway execution request — orchestrator/agent → Hermes runtime boundary (Phase 43).
 */
export interface HermesGatewayRequest {
  readonly requestId: string;
  readonly taskId: string;
  readonly userId: string;
  readonly intent: TaskIntent;
  readonly contextRef?: string;
  readonly correlationId?: string;
  readonly workflowStepId?: string;
}
