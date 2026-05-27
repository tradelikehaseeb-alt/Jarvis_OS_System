import type { TransportHealth } from "./transport-health";
import type { TransportProvider } from "./transport-provider";

/**
 * Registry of transport providers with a configurable default (Phase 52).
 */
export class TransportProviderRegistry {
  private readonly providers = new Map<string, TransportProvider>();
  private defaultProviderId: string;

  constructor(defaultProvider: TransportProvider) {
    this.register(defaultProvider);
    this.defaultProviderId = defaultProvider.providerId;
  }

  register(provider: TransportProvider): void {
    this.providers.set(provider.providerId, provider);
  }

  setDefaultProvider(providerId: string): void {
    if (!this.providers.has(providerId)) {
      throw new Error(`Transport provider not registered: ${providerId}`);
    }
    this.defaultProviderId = providerId;
  }

  resolve(providerId?: string): TransportProvider {
    const id = providerId ?? this.defaultProviderId;
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error(`Transport provider not found: ${id}`);
    }
    return provider;
  }

  getDefaultProviderId(): string {
    return this.defaultProviderId;
  }

  listProviderIds(): readonly string[] {
    return [...this.providers.keys()];
  }

  getHealth(providerId?: string): TransportHealth {
    return this.resolve(providerId).getHealth();
  }
}
