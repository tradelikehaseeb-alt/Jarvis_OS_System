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

import {
  readOpenClawRuntimeEnv,
  type EnvSource,
  type OpenClawRuntimeEnv,
} from "./openclaw-runtime-env";

export interface OpenClawRuntimeDiscoveryAdapterOptions {
  readonly env?: EnvSource;
  readonly probe?: EndpointProbeFn;
  readonly allowNetworkProbe?: boolean;
}

/**
 * Official OpenClaw **local** runtime discovery — env + safe HTTP probe only (Phase 21).
 *
 * Does not invoke OpenClaw, browser automation, or desktop automation.
 */
export class OpenClawRuntimeDiscoveryAdapter implements RuntimeProvider {
  readonly runtimeId: ProviderType = "openclaw-local";

  constructor(
    private readonly options: OpenClawRuntimeDiscoveryAdapterOptions = {},
  ) {}

  async detect(): Promise<RuntimeDetection> {
    const env = this.readEnv();
    return {
      runtimeId: this.runtimeId,
      configured: env.configured,
      endpoint: env.endpoint,
      stub: false,
      message: env.configured
        ? `OpenClaw local runtime configured (mode=${env.mode}) at ${env.endpoint}`
        : `OpenClaw local runtime not configured (mode=${env.mode})`,
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
        message: "OpenClaw local runtime is not configured",
        endpoint: detection.endpoint,
        stub: false,
        details: {
          mode: env.mode,
          configured: false,
          probe: "skipped",
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
        ? `OpenClaw endpoint reachable (${probeResult.probe} ${probeResult.statusCode ?? ""})`.trim()
        : `OpenClaw endpoint not reachable: ${probeResult.error ?? "unknown"}`,
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

  private readEnv(): OpenClawRuntimeEnv {
    return readOpenClawRuntimeEnv(this.options.env);
  }
}

/** Factory for {@link RuntimeManager} registration. */
export function createOpenClawRuntimeDiscoveryAdapter(
  options?: OpenClawRuntimeDiscoveryAdapterOptions,
): OpenClawRuntimeDiscoveryAdapter {
  return new OpenClawRuntimeDiscoveryAdapter(options);
}
