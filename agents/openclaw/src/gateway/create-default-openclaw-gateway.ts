import { DefaultOpenClawGateway } from "./default-openclaw-gateway";
import type { DefaultOpenClawGatewayOptions } from "./default-openclaw-gateway";
import type { OpenClawGateway } from "./openclaw-gateway";

/**
 * Factory for default OpenClaw gateway instance (Phase 42).
 */
export function createDefaultOpenClawGateway(
  options: DefaultOpenClawGatewayOptions = {},
): OpenClawGateway {
  return new DefaultOpenClawGateway(options);
}
