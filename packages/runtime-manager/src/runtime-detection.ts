import type { ProviderType } from "@jarvis/provider-registry";

/**
 * Whether a runtime endpoint is configured (Phase 20).
 * Does not perform network I/O in stub mode.
 */
export interface RuntimeDetection {
  readonly runtimeId: ProviderType;
  readonly configured: boolean;
  readonly endpoint: string;
  /** `true` for mock providers; `false` for official discovery adapters (Phase 21). */
  readonly stub: boolean;
  readonly message: string;
}
