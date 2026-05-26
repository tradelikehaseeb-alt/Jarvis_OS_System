import type { ProviderConfig } from "@jarvis/provider-registry";
import { DEFAULT_PROVIDER_CONFIG } from "@jarvis/provider-registry";

import { createHybridRuntimeManager } from "./create-hybrid-runtime-manager";
import type { RuntimeProvider } from "./runtime-provider";
import {
  createDefaultRuntimeResolver,
  type RuntimeResolver,
} from "./runtime-resolver";

/**
 * {@link RuntimeResolver} backed by official discovery providers + mocks for other ids (Phase 21).
 */
export function createDiscoveryRuntimeResolver(
  officialProviders: readonly RuntimeProvider[],
  config: ProviderConfig = DEFAULT_PROVIDER_CONFIG,
): RuntimeResolver {
  const manager = createHybridRuntimeManager(officialProviders);
  return createDefaultRuntimeResolver(config, manager);
}
