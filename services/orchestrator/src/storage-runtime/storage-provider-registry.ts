import type { StorageHealth } from "./storage-health";
import type { StorageProvider } from "./storage-provider";

/**
 * Registry of storage providers with a configurable default (Phase 51).
 */
export class StorageProviderRegistry {
  private readonly providers = new Map<string, StorageProvider>();
  private defaultProviderId: string;

  constructor(defaultProvider: StorageProvider) {
    this.register(defaultProvider);
    this.defaultProviderId = defaultProvider.providerId;
  }

  register(provider: StorageProvider): void {
    this.providers.set(provider.providerId, provider);
  }

  setDefaultProvider(providerId: string): void {
    if (!this.providers.has(providerId)) {
      throw new Error(`Storage provider not registered: ${providerId}`);
    }
    this.defaultProviderId = providerId;
  }

  resolve(providerId?: string): StorageProvider {
    const id = providerId ?? this.defaultProviderId;
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error(`Storage provider not found: ${id}`);
    }
    return provider;
  }

  getDefaultProviderId(): string {
    return this.defaultProviderId;
  }

  listProviderIds(): readonly string[] {
    return [...this.providers.keys()];
  }

  getHealth(providerId?: string): StorageHealth {
    return this.resolve(providerId).getHealth();
  }
}
