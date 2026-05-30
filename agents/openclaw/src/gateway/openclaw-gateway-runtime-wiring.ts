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
  createOpenClawRuntimeDiscoveryAdapter,
} from "../../adapter/official/src/openclaw-runtime-discovery-adapter";
import {
  readOpenClawRuntimeEnv,
  type EnvSource,
} from "../../adapter/official/src/openclaw-runtime-env";
import type { OpenClawRuntimeStatus } from "./openclaw-runtime-status";
import type { OpenClawRuntimeValidation } from "./openclaw-gateway-response";

export interface OpenClawGatewayRuntimeWiringOptions {
  readonly env?: EnvSource;
  readonly allowNetworkProbe?: boolean;
  readonly providerConfig?: ProviderConfig;
  readonly providerResolver?: ProviderResolver;
  readonly runtimeResolver?: RuntimeResolver;
}

export function mapOpenClawHealthStatus(
  status: string,
  stubMode: boolean,
): OpenClawRuntimeStatus {
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

export function validationFromOpenClawRuntimeHealth(
  health: RuntimeHealth,
): OpenClawRuntimeValidation {
  const status = mapOpenClawHealthStatus(health.status, false);
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
 * OpenClaw gateway runtime wiring — provider-registry + runtime-manager (Phase 44).
 */
export class OpenClawGatewayRuntimeWiring {
  private readonly env: EnvSource;
  private readonly providerResolver: ProviderResolver;
  private readonly runtimeResolver: RuntimeResolver;

  constructor(options: OpenClawGatewayRuntimeWiringOptions = {}) {
    const providerConfig = options.providerConfig ?? DEFAULT_PROVIDER_CONFIG;
    this.env = options.env ?? process.env;
    const allowNetworkProbe = options.allowNetworkProbe ?? false;

    this.providerResolver =
      options.providerResolver ?? createDefaultProviderResolver(providerConfig);
    this.runtimeResolver =
      options.runtimeResolver ??
      createDiscoveryRuntimeResolver(
        [
          createOpenClawRuntimeDiscoveryAdapter({
            env: this.env,
            allowNetworkProbe,
          }),
        ],
        providerConfig,
      );
  }

  isStubMode(): boolean {
    const mode = readOpenClawRuntimeEnv(this.env).mode;
    // `local` uses Jarvis Playwright browser runtime, not an external OpenClaw gateway probe.
    return mode === "stub" || mode === "local";
  }

  async resolveProviderMetadata(): Promise<ProviderMetadata> {
    return this.providerResolver.resolveOpenClaw().metadata;
  }

  async resolveConfiguredRuntime(): Promise<RuntimeDetection> {
    return this.runtimeResolver.detectConfiguredOpenClaw();
  }

  async getRuntimeHealth(): Promise<RuntimeHealth> {
    return this.runtimeResolver.checkOpenClawHealth();
  }
}

/** Factory for default OpenClaw gateway runtime wiring. */
export function createOpenClawGatewayRuntimeWiring(
  options: OpenClawGatewayRuntimeWiringOptions = {},
): OpenClawGatewayRuntimeWiring {
  return new OpenClawGatewayRuntimeWiring(options);
}
