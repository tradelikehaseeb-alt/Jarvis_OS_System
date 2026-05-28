import type { TaskIntent } from "@jarvis/types";

import type { HermesRecalledContext } from "./extract-recalled-context";

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
  /** Recalled conversational context for adaptive planning (Phase 93). */
  readonly recalledContext?: HermesRecalledContext;
}
