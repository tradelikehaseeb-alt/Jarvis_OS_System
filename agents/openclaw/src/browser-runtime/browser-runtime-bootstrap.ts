import type { BrowserRuntimeConfig } from "./browser-runtime-config";
import type { BrowserRuntimeHealth } from "./browser-runtime-health";
import type { BrowserRuntimeSession } from "./browser-runtime-session";
import type { BrowserRuntimeSessionInfo } from "./browser-runtime-session-info";

/**
 * Bootstrap contract for preparing browser execution sessions (Phase 68).
 */
export interface BrowserRuntimeBootstrap {
  readonly config: BrowserRuntimeConfig;
  initializeRuntime(): Promise<BrowserRuntimeSessionInfo>;
  validateRuntime(): Promise<BrowserRuntimeHealth>;
  createSession(): Promise<{
    readonly info: BrowserRuntimeSessionInfo;
    readonly session: BrowserRuntimeSession;
  }>;
  terminateRuntime(): Promise<BrowserRuntimeSessionInfo>;
}
