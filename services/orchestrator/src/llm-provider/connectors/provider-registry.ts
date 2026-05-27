import type { LlmProvider } from "../llm-provider";

import type { ProviderConfiguration, ProviderRegistryEntry } from "./provider-configuration";

/**
 * Registry of multi-provider LLM connectors (Phase 82).
 */
export interface ProviderRegistry {
  registerProvider(
    provider: LlmProvider,
    configuration: ProviderConfiguration,
  ): void;
  getProvider(providerId: string): LlmProvider | undefined;
  getConfiguration(providerId: string): ProviderConfiguration | undefined;
  listEntries(): readonly ProviderRegistryEntry[];
  listProviderIds(): readonly string[];
}

interface StoredProviderEntry extends ProviderRegistryEntry {
  readonly provider: LlmProvider;
}

export class InMemoryProviderRegistry implements ProviderRegistry {
  private readonly entries = new Map<string, StoredProviderEntry>();

  registerProvider(
    provider: LlmProvider,
    configuration: ProviderConfiguration,
  ): void {
    this.entries.set(configuration.providerId, {
      provider,
      configuration,
    });
  }

  getProvider(providerId: string): LlmProvider | undefined {
    return this.entries.get(providerId)?.provider;
  }

  getConfiguration(providerId: string): ProviderConfiguration | undefined {
    return this.entries.get(providerId)?.configuration;
  }

  listEntries(): readonly ProviderRegistryEntry[] {
    return [...this.entries.values()].map(({ configuration }) => ({
      configuration,
    }));
  }

  listProviderIds(): readonly string[] {
    return [...this.entries.keys()];
  }
}
