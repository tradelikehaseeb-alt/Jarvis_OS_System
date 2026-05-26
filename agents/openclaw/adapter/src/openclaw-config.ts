/**
 * Configuration for a {@link OpenClawAdapter} implementation (Phase 16).
 */
export interface OpenClawConfig {
  readonly adapterId: string;
  /** `stub` for mocks; `official` reserved for future OpenClaw gateway integration. */
  readonly mode: "stub" | "official";
  /** Gateway endpoint (unused in stub mode). */
  readonly gatewayEndpoint?: string;
  /** Require sandbox boundary before execution (enforced in future official adapter). */
  readonly sandboxRequired: boolean;
}

/** Default stub configuration. */
export const DEFAULT_OPENCLAW_CONFIG: OpenClawConfig = {
  adapterId: "openclaw-adapter-stub",
  mode: "stub",
  sandboxRequired: true,
} as const;
