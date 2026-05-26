import type { ProviderType } from "@jarvis/provider-registry";

import type { RuntimeDetection } from "./runtime-detection";
import type { RuntimeHealth } from "./runtime-health";
import type { RuntimeProvider } from "./runtime-provider";
import type { RuntimeStatus } from "./runtime-status";
import { isRuntimeReachable } from "./runtime-status";

export interface MockRuntimeProviderOptions {
  readonly endpoint?: string;
  readonly configured?: boolean;
  /** Override status for tests; default derives from runtime id. */
  readonly status?: RuntimeStatus;
  readonly message?: string;
}

function defaultEndpoint(runtimeId: ProviderType): string {
  if (runtimeId === "hermes-local") {
    return "stub://127.0.0.1:hermes";
  }
  if (runtimeId === "hermes-cloud") {
    return "https://stub.cloud/hermes";
  }
  if (runtimeId === "openclaw-local") {
    return "stub://127.0.0.1:18789";
  }
  return "https://stub.remote/openclaw-gateway";
}

function defaultStatus(runtimeId: ProviderType): RuntimeStatus {
  switch (runtimeId) {
    case "hermes-local":
    case "openclaw-local":
      return "available";
    case "hermes-cloud":
    case "openclaw-remote":
      return "degraded";
    default:
      return "unknown";
  }
}

function defaultMessage(runtimeId: ProviderType, status: RuntimeStatus): string {
  return `Mock runtime ${runtimeId}: ${status} (no live probe)`;
}

/**
 * Static {@link RuntimeProvider} — deterministic detection/health (Phase 20).
 */
export class MockRuntimeProvider implements RuntimeProvider {
  readonly runtimeId: ProviderType;

  constructor(
    runtimeId: ProviderType,
    private readonly options: MockRuntimeProviderOptions = {},
  ) {
    this.runtimeId = runtimeId;
  }

  async detect(): Promise<RuntimeDetection> {
    const endpoint = this.options.endpoint ?? defaultEndpoint(this.runtimeId);
    const configured = this.options.configured ?? true;
    return {
      runtimeId: this.runtimeId,
      configured,
      endpoint,
      stub: true,
      message: configured
        ? `Runtime ${this.runtimeId} configured at ${endpoint}`
        : `Runtime ${this.runtimeId} not configured`,
    };
  }

  async checkHealth(): Promise<RuntimeHealth> {
    const detection = await this.detect();
    const status = this.options.status ?? defaultStatus(this.runtimeId);
    const message =
      this.options.message ?? defaultMessage(this.runtimeId, status);

    return {
      runtimeId: this.runtimeId,
      status,
      available: isRuntimeReachable(status) && detection.configured,
      lastCheckedAt: new Date().toISOString(),
      message,
      endpoint: detection.endpoint,
      stub: true,
      details: {
        configured: detection.configured,
        probe: "mock",
      },
    };
  }
}
