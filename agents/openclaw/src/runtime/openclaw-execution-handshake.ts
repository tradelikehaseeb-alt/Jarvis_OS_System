import type { OpenClawGatewayResponse } from "../gateway/openclaw-gateway-response";

import type { OpenClawExecutionState } from "./openclaw-execution-state";
import type { OpenClawRuntimeHealth } from "./openclaw-runtime-health";

/**
 * Runtime execution handshake result (Phase 58).
 */
export interface OpenClawExecutionHandshake {
  readonly sessionId: string;
  readonly state: OpenClawExecutionState;
  readonly runtimeHealth?: OpenClawRuntimeHealth;
  readonly initializedAt?: string;
  readonly validatedAt?: string;
  readonly completedAt?: string;
  readonly terminatedAt?: string;
  readonly response?: OpenClawGatewayResponse;
  readonly error?: {
    readonly code: string;
    readonly message: string;
  };
}
