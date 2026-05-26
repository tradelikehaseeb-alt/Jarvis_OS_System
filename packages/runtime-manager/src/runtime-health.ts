import type { ProviderType } from "@jarvis/provider-registry";

import type { RuntimeStatus } from "./runtime-status";

/**
 * Result of a runtime health probe (Phase 20).
 * Mock implementations only until official integrations ship.
 */
export interface RuntimeHealth {
  readonly runtimeId: ProviderType;
  readonly status: RuntimeStatus;
  /** Convenience flag — `true` when status is `available` or `degraded`. */
  readonly available: boolean;
  readonly lastCheckedAt: string;
  readonly message: string;
  readonly endpoint: string;
  /** `true` for mock providers; `false` for official discovery adapters (Phase 21). */
  readonly stub: boolean;
  readonly details?: Readonly<Record<string, unknown>>;
}

/**
 * Aggregate health for configured Hermes + OpenClaw runtimes.
 */
export interface RuntimeHealthReport {
  readonly hermes: RuntimeHealth;
  readonly openclaw: RuntimeHealth;
  readonly allAvailable: boolean;
  readonly checkedAt: string;
}
