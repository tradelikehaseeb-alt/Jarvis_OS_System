/**
 * Browser runtime bootstrap configuration (Phase 68).
 */
export interface BrowserRuntimeConfig {
  /** When true, uses stub validation and execution (default). */
  readonly stub?: boolean;
  /** Prefix for bootstrap-level session identifiers. */
  readonly sessionIdPrefix?: string;
  /** Sandbox boundary flag for future real browser runs. */
  readonly sandbox?: boolean;
}
