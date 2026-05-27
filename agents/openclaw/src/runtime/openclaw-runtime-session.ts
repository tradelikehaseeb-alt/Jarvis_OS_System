import type { OpenClawGatewayRequest } from "../gateway/openclaw-gateway-request";

import type { OpenClawExecutionHandshake } from "./openclaw-execution-handshake";
import type { OpenClawExecutionState } from "./openclaw-execution-state";
import type { OpenClawRuntimeHealth } from "./openclaw-runtime-health";

/**
 * OpenClaw runtime execution session contract (Phase 58).
 */
export interface OpenClawRuntimeSession {
  readonly sessionId: string;
  readonly state: OpenClawExecutionState;
  initializeSession(): Promise<OpenClawExecutionHandshake>;
  validateRuntime(): Promise<OpenClawRuntimeHealth>;
  executeTask(request: OpenClawGatewayRequest): Promise<OpenClawExecutionHandshake>;
  terminateSession(): Promise<OpenClawExecutionHandshake>;
}
