import type { HermesProviderType, OpenClawProviderType } from "./provider-type";

/**
 * Active provider selection — configured at bootstrap or via env (Phase 17).
 */
export interface ProviderConfig {
  readonly hermesProviderId: HermesProviderType;
  readonly openclawProviderId: OpenClawProviderType;
}

/** Default local providers for development and tests. */
export const DEFAULT_PROVIDER_CONFIG: ProviderConfig = {
  hermesProviderId: "hermes-local",
  openclawProviderId: "openclaw-local",
} as const;
