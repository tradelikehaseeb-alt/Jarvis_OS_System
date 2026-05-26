/**
 * Configuration for a {@link HermesAdapter} implementation (Phase 16).
 *
 * Official integrations will extend this with API keys, endpoints, and model ids.
 * Stub mode ignores network-related fields.
 */
export interface HermesConfig {
  /** Adapter implementation identifier (e.g. `hermes-adapter-stub`). */
  readonly adapterId: string;
  /**
   * Runtime mode — `stub` for static mocks; `official` reserved for future integration.
   */
  readonly mode: "stub" | "official";
  /** Optional service endpoint (unused in stub mode). */
  readonly endpoint?: string;
  /** Optional model or profile name (unused in stub mode). */
  readonly modelId?: string;
}

/** Default stub configuration for development and tests. */
export const DEFAULT_HERMES_CONFIG: HermesConfig = {
  adapterId: "hermes-adapter-stub",
  mode: "stub",
} as const;
