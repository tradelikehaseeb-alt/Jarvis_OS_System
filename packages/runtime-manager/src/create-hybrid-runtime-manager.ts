import type { ProviderType } from "@jarvis/provider-registry";

import { SUPPORTED_RUNTIME_IDS } from "./default-runtimes";
import { MockRuntimeProvider } from "./mock-runtime-provider";
import {
  InMemoryRuntimeManager,
  type InMemoryRuntimeManager as Manager,
} from "./runtime-manager";
import type { RuntimeProvider } from "./runtime-provider";

/**
 * Register official discovery providers and mock providers for remaining runtime ids (Phase 21).
 */
export function createHybridRuntimeManager(
  officialProviders: readonly RuntimeProvider[],
): Manager {
  const manager = new InMemoryRuntimeManager();
  const officialById = new Map<ProviderType, RuntimeProvider>(
    officialProviders.map((p) => [p.runtimeId, p]),
  );

  for (const runtimeId of SUPPORTED_RUNTIME_IDS) {
    const official = officialById.get(runtimeId);
    manager.register(official ?? new MockRuntimeProvider(runtimeId));
  }

  return manager;
}

/**
 * Replace mock providers with official discovery when env signals are present.
 */
export function registerOfficialDiscoveryProviders(
  manager: { register(provider: RuntimeProvider): void },
  officialProviders: readonly RuntimeProvider[],
): void {
  for (const provider of officialProviders) {
    manager.register(provider);
  }
}
