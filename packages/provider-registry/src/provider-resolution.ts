import type { ProviderMetadata } from "./provider-metadata";

/**
 * Result of resolving a configured provider (Phase 17).
 * Static/mock payload only — no live service handles.
 */
export interface ProviderResolution {
  readonly metadata: ProviderMetadata;
  readonly stub: true;
  /** Mock provider hints passed to adapters (labels, endpoints placeholders). */
  readonly stubPayload: Readonly<{
    readonly label: string;
    readonly endpoint: string;
    readonly ready: boolean;
  }>;
}
