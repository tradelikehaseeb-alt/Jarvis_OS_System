import {
  DEFAULT_PROVIDER_CONFIG,
  createDefaultProviderResolver,
  type ProviderConfig,
  type ProviderMetadata,
  type ProviderResolver,
} from "@jarvis/provider-registry";
import {
  createDiscoveryRuntimeResolver,
  type RuntimeDetection,
  type RuntimeHealth,
  type RuntimeResolver,
} from "@jarvis/runtime-manager";

import {
  createHermesRuntimeDiscoveryAdapter,
} from "../../adapter/official/src/hermes-runtime-discovery-adapter";
import {
  readHermesRuntimeEnv,
  type EnvSource,
} from "../../adapter/official/src/hermes-runtime-env";
import type { HermesRuntimeStatus } from "./hermes-runtime-status";
import type { HermesRuntimeValidation } from "./hermes-gateway-response";

export interface HermesGatewayRuntimeWiringOptions {
  readonly env?: EnvSource;
  readonly allowNetworkProbe?: boolean;
  readonly providerConfig?: ProviderConfig;
  readonly providerResolver?: ProviderResolver;
  readonly runtimeResolver?: RuntimeResolver;
}

export function mapHermesHealthStatus(
  status: string,
  stubMode: boolean,
): HermesRuntimeStatus {
  if (stubMode) {
    return "stub";
  }
  switch (status) {
    case "available":
      return "available";
    case "degraded":
      return "degraded";
    case "unavailable":
      return "unavailable";
    default:
      return "unknown";
  }
}

export function validationFromHermesRuntimeHealth(
  health: RuntimeHealth,
): HermesRuntimeValidation {
  const status = mapHermesHealthStatus(health.status, false);
  const reasons: string[] = [];

  if (!health.available) {
    reasons.push(health.message);
  }

  return {
    valid: health.available || status === "degraded",
    status,
    reasons,
  };
}

/**
 * Hermes gateway runtime wiring — provider-registry + runtime-manager (Phase 44).
 */
export class HermesGatewayRuntimeWiring {
  private readonly env: EnvSource;
  private readonly providerResolver: ProviderResolver;
  private readonly runtimeResolver: RuntimeResolver;

  constructor(options: HermesGatewayRuntimeWiringOptions = {}) {
    const providerConfig = options.providerConfig ?? DEFAULT_PROVIDER_CONFIG;
    this.env = options.env ?? process.env;
    const allowNetworkProbe = options.allowNetworkProbe ?? false;

    this.providerResolver =
      options.providerResolver ?? createDefaultProviderResolver(providerConfig);
    this.runtimeResolver =
      options.runtimeResolver ??
      createDiscoveryRuntimeResolver(
        [
          createHermesRuntimeDiscoveryAdapter({
            env: this.env,
            allowNetworkProbe,
          }),
        ],
        providerConfig,
      );
  }

  isStubMode(): boolean {
    return readHermesRuntimeEnv(this.env).mode === "stub";
  }

  async resolveProviderMetadata(): Promise<ProviderMetadata> {
    return this.providerResolver.resolveHermes().metadata;
  }

  async resolveConfiguredRuntime(): Promise<RuntimeDetection> {
    return this.runtimeResolver.detectConfiguredHermes();
  }

  async getRuntimeHealth(): Promise<RuntimeHealth> {
    return this.runtimeResolver.checkHermesHealth();
  }
}

/** Factory for default Hermes gateway runtime wiring. */
export function createHermesGatewayRuntimeWiring(
  options: HermesGatewayRuntimeWiringOptions = {},
): HermesGatewayRuntimeWiring {
  return new HermesGatewayRuntimeWiring(options);
}
