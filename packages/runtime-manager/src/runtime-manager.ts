import type { ProviderType } from "@jarvis/provider-registry";

import {
  createDefaultMockRuntimeProviders,
} from "./default-runtimes";
import type { RuntimeDetection } from "./runtime-detection";
import type { RuntimeHealth } from "./runtime-health";
import type { RuntimeProvider } from "./runtime-provider";

/**
 * Registry and coordinator for external runtime health (Phase 20).
 */
export interface RuntimeManager {
  readonly managerId: "runtime-manager";

  register(provider: RuntimeProvider): void;

  list(): readonly ProviderType[];

  get(runtimeId: ProviderType): RuntimeProvider | undefined;

  detect(runtimeId: ProviderType): Promise<RuntimeDetection>;

  checkHealth(runtimeId: ProviderType): Promise<RuntimeHealth>;

  checkHealthMany(runtimeIds: readonly ProviderType[]): Promise<RuntimeHealth[]>;
}

/**
 * In-memory {@link RuntimeManager} backed by {@link RuntimeProvider} instances.
 */
export class InMemoryRuntimeManager implements RuntimeManager {
  readonly managerId = "runtime-manager" as const;

  private readonly providers = new Map<ProviderType, RuntimeProvider>();

  register(provider: RuntimeProvider): void {
    this.providers.set(provider.runtimeId, provider);
  }

  list(): readonly ProviderType[] {
    return [...this.providers.keys()];
  }

  get(runtimeId: ProviderType): RuntimeProvider | undefined {
    return this.providers.get(runtimeId);
  }

  async detect(runtimeId: ProviderType): Promise<RuntimeDetection> {
    const provider = this.requireProvider(runtimeId);
    return provider.detect();
  }

  async checkHealth(runtimeId: ProviderType): Promise<RuntimeHealth> {
    const provider = this.requireProvider(runtimeId);
    return provider.checkHealth();
  }

  async checkHealthMany(
    runtimeIds: readonly ProviderType[],
  ): Promise<RuntimeHealth[]> {
    return Promise.all(runtimeIds.map((id) => this.checkHealth(id)));
  }

  private requireProvider(runtimeId: ProviderType): RuntimeProvider {
    const provider = this.providers.get(runtimeId);
    if (!provider) {
      throw new Error(`Runtime provider ${runtimeId} is not registered`);
    }
    return provider;
  }
}

/** Register default mock providers into a manager instance. */
export function registerDefaultRuntimes(
  manager: { register(provider: RuntimeProvider): void },
  providers: readonly RuntimeProvider[] = createDefaultMockRuntimeProviders(),
): void {
  for (const provider of providers) {
    manager.register(provider);
  }
}

/** Manager pre-loaded with mock providers for all supported runtime ids. */
export function createDefaultRuntimeManager(): InMemoryRuntimeManager {
  const manager = new InMemoryRuntimeManager();
  registerDefaultRuntimes(manager);
  return manager;
}
