import type { ProviderType } from "@jarvis/provider-registry";
import type {
  EndpointProbeFn,
  RuntimeDetection,
  RuntimeHealth,
  RuntimeProvider,
} from "@jarvis/runtime-manager";
import {
  isRuntimeReachable,
  safeEndpointProbe,
} from "@jarvis/runtime-manager";

import { isHermesPythonAgentConfigured } from "./hermes-python-runtime-config";
import { resolveHermesAgentRoot } from "./hermes-python-process-runner";
import {
  readHermesRuntimeEnv,
  type EnvSource,
  type HermesRuntimeEnv,
} from "./hermes-runtime-env";

export interface HermesRuntimeDiscoveryAdapterOptions {
  readonly env?: EnvSource;
  readonly probe?: EndpointProbeFn;
  readonly allowNetworkProbe?: boolean;
}

/**
 * Official Hermes **local** runtime discovery — env + safe HTTP probe only (Phase 21).
 *
 * Does not invoke Hermes, LLMs, or skills.
 */
export class HermesRuntimeDiscoveryAdapter implements RuntimeProvider {
  readonly runtimeId: ProviderType = "hermes-local";

  constructor(
    private readonly options: HermesRuntimeDiscoveryAdapterOptions = {},
  ) {}

  async detect(): Promise<RuntimeDetection> {
    const env = this.readEnv();
    return {
      runtimeId: this.runtimeId,
      configured: env.configured,
      endpoint: env.endpoint,
      stub: false,
      message: env.configured
        ? `Hermes local runtime configured (mode=${env.mode}) at ${env.endpoint}`
        : `Hermes local runtime not configured (mode=${env.mode})`,
    };
  }

  async checkHealth(): Promise<RuntimeHealth> {
    const detection = await this.detect();
    const env = this.readEnv();
    const lastCheckedAt = new Date().toISOString();

    if (!detection.configured) {
      return {
        runtimeId: this.runtimeId,
        status: "unavailable",
        available: false,
        lastCheckedAt,
        message: "Hermes local runtime is not configured",
        endpoint: detection.endpoint,
        stub: false,
        details: {
          mode: env.mode,
          configured: false,
          probe: "skipped",
        },
      };
    }

    const envSource = this.options.env ?? process.env;
    if (isHermesPythonAgentConfigured(envSource)) {
      const agentRoot = resolveHermesAgentRoot(envSource);
      return {
        runtimeId: this.runtimeId,
        status: "available",
        available: true,
        lastCheckedAt,
        message: `Hermes Python agent configured at ${agentRoot}`,
        endpoint: detection.endpoint,
        stub: false,
        details: {
          mode: env.mode,
          configured: true,
          probe: "python-agent",
          agentRoot,
        },
      };
    }

    const probeFn = this.options.probe ?? safeEndpointProbe;
    const probeResult = await probeFn(detection.endpoint, {
      allowNetwork: this.options.allowNetworkProbe ?? true,
    });

    const status = probeResult.reachable
      ? "available"
      : probeResult.probe === "skipped"
        ? "unknown"
        : "unavailable";

    return {
      runtimeId: this.runtimeId,
      status,
      available: isRuntimeReachable(status) && detection.configured,
      lastCheckedAt,
      message: probeResult.reachable
        ? `Hermes endpoint reachable (${probeResult.probe} ${probeResult.statusCode ?? ""})`.trim()
        : `Hermes endpoint not reachable: ${probeResult.error ?? "unknown"}`,
      endpoint: detection.endpoint,
      stub: false,
      details: {
        mode: env.mode,
        configured: true,
        probe: probeResult.probe,
        statusCode: probeResult.statusCode,
        error: probeResult.error,
      },
    };
  }

  private readEnv(): HermesRuntimeEnv {
    return readHermesRuntimeEnv(this.options.env);
  }
}

/** Factory for {@link RuntimeManager} registration. */
export function createHermesRuntimeDiscoveryAdapter(
  options?: HermesRuntimeDiscoveryAdapterOptions,
): HermesRuntimeDiscoveryAdapter {
  return new HermesRuntimeDiscoveryAdapter(options);
}
