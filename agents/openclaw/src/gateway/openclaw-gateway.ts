import type { ProviderMetadata } from "@jarvis/provider-registry";
import type { RuntimeDetection, RuntimeHealth } from "@jarvis/runtime-manager";

import type { OpenClawGatewayRequest } from "./openclaw-gateway-request";
import type {
  OpenClawGatewayResponse,
  OpenClawRuntimeValidation,
} from "./openclaw-gateway-response";
import type { OpenClawRuntimeStatus } from "./openclaw-runtime-status";

/**
 * OpenClaw gateway contract — execution/runtime boundary (Phase 42–44).
 */
export interface OpenClawGateway {
  execute(request: OpenClawGatewayRequest): Promise<OpenClawGatewayResponse>;
  getRuntimeStatus(): Promise<OpenClawRuntimeStatus>;
  validateRuntime(): Promise<OpenClawRuntimeValidation>;
  resolveConfiguredRuntime(): Promise<RuntimeDetection>;
  resolveProviderMetadata(): Promise<ProviderMetadata>;
  getRuntimeHealth(): Promise<RuntimeHealth>;
}
