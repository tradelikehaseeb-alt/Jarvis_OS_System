import type { BrowserExecutionRequest } from "./browser-execution-request";
import type { BrowserExecutionResult } from "./browser-execution-result";
import type { BrowserRuntimeHealth } from "./browser-runtime-health";
import type { BrowserRuntimeState } from "./browser-runtime-state";

/**
 * Browser runtime session contract (Phase 61).
 */
export interface BrowserRuntimeSession {
  readonly sessionId: string;
  readonly state: BrowserRuntimeState;
  initializeSession(): Promise<BrowserRuntimeSessionSnapshot>;
  validateBrowser(): Promise<BrowserRuntimeHealth>;
  executeBrowserTask(request: BrowserExecutionRequest): Promise<BrowserExecutionResult>;
  terminateSession(): Promise<BrowserRuntimeSessionSnapshot>;
}

export interface BrowserRuntimeSessionSnapshot {
  readonly sessionId: string;
  readonly state: BrowserRuntimeState;
  readonly initializedAt?: string;
  readonly terminatedAt?: string;
  readonly error?: {
    readonly code: string;
    readonly message: string;
  };
}
