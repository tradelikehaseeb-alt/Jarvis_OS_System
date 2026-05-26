import type { ProviderFamily, ProviderType } from "./provider-type";

/**
 * Catalog metadata for a registered provider (Phase 17).
 */
export interface ProviderMetadata {
  readonly providerId: ProviderType;
  readonly family: ProviderFamily;
  readonly displayName: string;
  /** Deployment topology hint for future official adapters. */
  readonly deployment: "local" | "cloud" | "remote";
  /** Always true until official integrations ship. */
  readonly stub: true;
  readonly description: string;
}
