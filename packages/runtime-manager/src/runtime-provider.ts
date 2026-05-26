import type { ProviderType } from "@jarvis/provider-registry";

import type { RuntimeDetection } from "./runtime-detection";
import type { RuntimeHealth } from "./runtime-health";

/**
 * Pluggable health probe for one external runtime (Phase 20).
 * Official discovery adapters (Phase 21) and future execution adapters implement this interface.
 */
export interface RuntimeProvider {
  readonly runtimeId: ProviderType;

  /** Detect whether this runtime is configured in the environment (no network in stub mode). */
  detect(): Promise<RuntimeDetection>;

  /** Probe runtime availability — mock/static until official wiring. */
  checkHealth(): Promise<RuntimeHealth>;
}
