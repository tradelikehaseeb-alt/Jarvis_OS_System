import type { ProviderConfig } from "./provider-config";
import { DEFAULT_PROVIDER_CONFIG } from "./provider-config";
import type { ProviderResolution } from "./provider-resolution";
import type { ProviderRegistry } from "./provider-registry";
import { InMemoryProviderRegistry } from "./provider-registry";
import { registerDefaultProviders } from "./default-providers";
import type { HermesProviderType, OpenClawProviderType } from "./provider-type";
import { isHermesProviderType, isOpenClawProviderType } from "./provider-type";

/**
 * Resolves configured Hermes/OpenClaw providers from {@link ProviderRegistry} (Phase 17).
 */
export class ProviderResolver {
  constructor(
    private readonly registry: ProviderRegistry,
    private readonly config: ProviderConfig,
  ) {}

  /** Active Hermes provider id from config. */
  get hermesProviderId(): HermesProviderType {
    return this.config.hermesProviderId;
  }

  /** Active OpenClaw provider id from config. */
  get openclawProviderId(): OpenClawProviderType {
    return this.config.openclawProviderId;
  }

  /**
   * Resolve configured Hermes provider — static/mock payload only.
   */
  resolveHermes(): ProviderResolution {
    return this.resolveProvider(this.config.hermesProviderId);
  }

  /**
   * Resolve configured OpenClaw provider — static/mock payload only.
   */
  resolveOpenClaw(): ProviderResolution {
    return this.resolveProvider(this.config.openclawProviderId);
  }

  private resolveProvider(
    providerId: HermesProviderType | OpenClawProviderType,
  ): ProviderResolution {
    const metadata = this.registry.resolve(providerId);
    if (!metadata) {
      throw new Error(`Provider ${providerId} is not registered`);
    }

    return {
      metadata,
      stub: true,
      stubPayload: buildStubPayload(metadata),
    };
  }
}

function buildStubPayload(
  metadata: ProviderResolution["metadata"],
): ProviderResolution["stubPayload"] {
  const endpoint =
    metadata.deployment === "local"
      ? `stub://${metadata.providerId}`
      : metadata.deployment === "cloud"
        ? `https://stub.cloud/${metadata.providerId}`
        : `https://stub.remote/${metadata.providerId}`;

  return {
    label: `${metadata.displayName} (mock)`,
    endpoint,
    ready: true,
  };
}

/**
 * Create resolver with default catalog and config.
 */
export function createDefaultProviderResolver(
  config: ProviderConfig = DEFAULT_PROVIDER_CONFIG,
  registry: ProviderRegistry = createDefaultProviderRegistry(),
): ProviderResolver {
  return new ProviderResolver(registry, config);
}

/** Registry pre-loaded with hermes-local, hermes-cloud, openclaw-local, openclaw-remote. */
export function createDefaultProviderRegistry(): InMemoryProviderRegistry {
  const registry = new InMemoryProviderRegistry();
  registerDefaultProviders(registry);
  return registry;
}

/**
 * Validate config ids exist and match expected families.
 */
export function validateProviderConfig(
  config: ProviderConfig,
  registry: ProviderRegistry,
): void {
  const hermes = registry.resolve(config.hermesProviderId);
  const openclaw = registry.resolve(config.openclawProviderId);

  if (!hermes || !isHermesProviderType(hermes.providerId)) {
    throw new Error(`Invalid Hermes provider: ${config.hermesProviderId}`);
  }
  if (!openclaw || !isOpenClawProviderType(openclaw.providerId)) {
    throw new Error(`Invalid OpenClaw provider: ${config.openclawProviderId}`);
  }
}
