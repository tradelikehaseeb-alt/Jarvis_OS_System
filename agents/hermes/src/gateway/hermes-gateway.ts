import type { ProviderMetadata } from "@jarvis/provider-registry";
import type { RuntimeDetection, RuntimeHealth } from "@jarvis/runtime-manager";

import type { HermesGatewayRequest } from "./hermes-gateway-request";
import type {
  HermesGatewayResponse,
  HermesRuntimeValidation,
} from "./hermes-gateway-response";
import type { HermesRuntimeStatus } from "./hermes-runtime-status";

/**
 * Hermes gateway contract — planning/runtime boundary (Phase 43–44).
 */
export interface HermesGateway {
  execute(request: HermesGatewayRequest): Promise<HermesGatewayResponse>;
  getRuntimeStatus(): Promise<HermesRuntimeStatus>;
  validateRuntime(): Promise<HermesRuntimeValidation>;
  resolveConfiguredRuntime(): Promise<RuntimeDetection>;
  resolveProviderMetadata(): Promise<ProviderMetadata>;
  getRuntimeHealth(): Promise<RuntimeHealth>;
}
