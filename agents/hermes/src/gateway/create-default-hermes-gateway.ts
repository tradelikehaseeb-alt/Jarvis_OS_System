import { DefaultHermesGateway } from "./default-hermes-gateway";
import type { DefaultHermesGatewayOptions } from "./default-hermes-gateway";
import type { HermesGateway } from "./hermes-gateway";

/**
 * Factory for default Hermes gateway instance (Phase 43).
 */
export function createDefaultHermesGateway(
  options: DefaultHermesGatewayOptions = {},
): HermesGateway {
  return new DefaultHermesGateway(options);
}
