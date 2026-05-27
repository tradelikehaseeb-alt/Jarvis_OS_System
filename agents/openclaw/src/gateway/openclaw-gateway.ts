import type { OpenClawGatewayRequest } from "./openclaw-gateway-request";
import type {
  OpenClawGatewayResponse,
  OpenClawRuntimeValidation,
} from "./openclaw-gateway-response";
import type { OpenClawRuntimeStatus } from "./openclaw-runtime-status";

/**
 * OpenClaw gateway contract — single execution/runtime boundary (Phase 42).
 */
export interface OpenClawGateway {
  execute(request: OpenClawGatewayRequest): Promise<OpenClawGatewayResponse>;
  getRuntimeStatus(): Promise<OpenClawRuntimeStatus>;
  validateRuntime(): Promise<OpenClawRuntimeValidation>;
}
