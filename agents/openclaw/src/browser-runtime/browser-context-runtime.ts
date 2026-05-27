import type { BrowserPageContext, BrowserPageContextUpdate } from "./browser-page-context";

/**
 * Maintains stub page/session state across browser actions (Phase 70).
 */
export interface BrowserContextRuntime {
  initializeContext(sessionId: string): Promise<BrowserPageContext>;
  updateContext(update: BrowserPageContextUpdate): Promise<BrowserPageContext>;
  getCurrentContext(): BrowserPageContext | undefined;
  clearContext(): Promise<void>;
}
