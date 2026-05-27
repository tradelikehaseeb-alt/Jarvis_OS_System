import type { HermesGatewayRequest } from "./hermes-gateway-request";
import type {
  HermesGatewayResponse,
  HermesRuntimeValidation,
} from "./hermes-gateway-response";
import type { HermesRuntimeStatus } from "./hermes-runtime-status";

/**
 * Hermes gateway contract — single planning/runtime boundary (Phase 43).
 */
export interface HermesGateway {
  execute(request: HermesGatewayRequest): Promise<HermesGatewayResponse>;
  getRuntimeStatus(): Promise<HermesRuntimeStatus>;
  validateRuntime(): Promise<HermesRuntimeValidation>;
}
