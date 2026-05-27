import type { HermesGatewayResponse } from "../gateway/hermes-gateway-response";

import type { HermesPlanningState } from "./hermes-planning-state";
import type { HermesRuntimeHealth } from "./hermes-runtime-health";

/**
 * Runtime planning handshake result (Phase 59).
 */
export interface HermesPlanningHandshake {
  readonly sessionId: string;
  readonly state: HermesPlanningState;
  readonly runtimeHealth?: HermesRuntimeHealth;
  readonly initializedAt?: string;
  readonly validatedAt?: string;
  readonly completedAt?: string;
  readonly terminatedAt?: string;
  readonly response?: HermesGatewayResponse;
  readonly error?: {
    readonly code: string;
    readonly message: string;
  };
}
