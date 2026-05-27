import type { BrowserRuntimeState } from "./browser-runtime-state";

/**
 * Bootstrap-level browser runtime session snapshot (Phase 68).
 */
export interface BrowserRuntimeSessionInfo {
  readonly sessionId: string;
  readonly state: BrowserRuntimeState;
  readonly stub: boolean;
  readonly initializedAt?: string;
  readonly validatedAt?: string;
  readonly terminatedAt?: string;
}
