import type { ProviderConfig } from "@jarvis/provider-registry";
import { DEFAULT_PROVIDER_CONFIG } from "@jarvis/provider-registry";
import type { ProviderResolver } from "@jarvis/provider-registry";
import { createDefaultProviderResolver } from "@jarvis/provider-registry";

import type { RuntimeDetection } from "./runtime-detection";
import type { RuntimeHealth, RuntimeHealthReport } from "./runtime-health";
import type { RuntimeManager } from "./runtime-manager";
import { createDefaultRuntimeManager } from "./runtime-manager";

/**
 * Resolves configured runtimes and runs health checks (Phase 20).
 */
export class RuntimeResolver {
  constructor(
    private readonly manager: RuntimeManager,
    private readonly providerResolver: ProviderResolver,
  ) {}

  get hermesRuntimeId() {
    return this.providerResolver.hermesProviderId;
  }

  get openclawRuntimeId() {
    return this.providerResolver.openclawProviderId;
  }

  /**
   * Detect whether configured Hermes runtime endpoint is present (mock).
   */
  async detectConfiguredHermes(): Promise<RuntimeDetection> {
    return this.manager.detect(this.hermesRuntimeId);
  }

  /**
   * Detect whether configured OpenClaw runtime endpoint is present (mock).
   */
  async detectConfiguredOpenClaw(): Promise<RuntimeDetection> {
    return this.manager.detect(this.openclawRuntimeId);
  }

  /** Health check for active Hermes runtime. */
  async checkHermesHealth(): Promise<RuntimeHealth> {
    return this.manager.checkHealth(this.hermesRuntimeId);
  }

  /** Health check for active OpenClaw runtime. */
  async checkOpenClawHealth(): Promise<RuntimeHealth> {
    return this.manager.checkHealth(this.openclawRuntimeId);
  }

  /**
   * Health report for both configured provider runtimes.
   */
  async checkConfiguredRuntimes(): Promise<RuntimeHealthReport> {
    const [hermes, openclaw] = await Promise.all([
      this.checkHermesHealth(),
      this.checkOpenClawHealth(),
    ]);

    return {
      hermes,
      openclaw,
      allAvailable: hermes.available && openclaw.available,
      checkedAt: new Date().toISOString(),
    };
  }

  /**
   * Probe every runtime registered in the manager (catalog-wide).
   */
  async checkAllRegistered(): Promise<RuntimeHealth[]> {
    return this.manager.checkHealthMany(this.manager.list());
  }
}

/**
 * Factory with default provider + runtime wiring.
 */
export function createDefaultRuntimeResolver(
  config: ProviderConfig = DEFAULT_PROVIDER_CONFIG,
  manager: RuntimeManager = createDefaultRuntimeManager(),
): RuntimeResolver {
  const providerResolver = createDefaultProviderResolver(config);
  return new RuntimeResolver(manager, providerResolver);
}
