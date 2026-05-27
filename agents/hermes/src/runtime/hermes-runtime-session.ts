import type { HermesGatewayRequest } from "../gateway/hermes-gateway-request";

import type { HermesPlanningHandshake } from "./hermes-planning-handshake";
import type { HermesPlanningState } from "./hermes-planning-state";
import type { HermesRuntimeHealth } from "./hermes-runtime-health";

/**
 * Hermes runtime planning session contract (Phase 59).
 */
export interface HermesRuntimeSession {
  readonly sessionId: string;
  readonly state: HermesPlanningState;
  initializeSession(): Promise<HermesPlanningHandshake>;
  validateRuntime(): Promise<HermesRuntimeHealth>;
  generatePlan(request: HermesGatewayRequest): Promise<HermesPlanningHandshake>;
  terminateSession(): Promise<HermesPlanningHandshake>;
}
