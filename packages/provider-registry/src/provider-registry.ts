import type { ProviderMetadata } from "./provider-metadata";
import type { ProviderFamily, ProviderType } from "./provider-type";

/**
 * Registry of external provider metadata (Phase 17).
 */
export interface ProviderRegistry {
  readonly registryId: "provider-registry";

  register(metadata: ProviderMetadata): void;

  list(): readonly ProviderMetadata[];

  listByFamily(family: ProviderFamily): readonly ProviderMetadata[];

  resolve(providerId: ProviderType): ProviderMetadata | undefined;
}

/**
 * In-memory {@link ProviderRegistry} with static catalog support.
 */
export class InMemoryProviderRegistry implements ProviderRegistry {
  readonly registryId = "provider-registry" as const;

  private readonly providers = new Map<ProviderType, ProviderMetadata>();

  register(metadata: ProviderMetadata): void {
    this.providers.set(metadata.providerId, metadata);
  }

  list(): readonly ProviderMetadata[] {
    return [...this.providers.values()];
  }

  listByFamily(family: ProviderFamily): readonly ProviderMetadata[] {
    return this.list().filter((p) => p.family === family);
  }

  resolve(providerId: ProviderType): ProviderMetadata | undefined {
    return this.providers.get(providerId);
  }
}
