import type { BrowserAction } from "./browser-action";
import type { BrowserPageSnapshot } from "./browser-page-snapshot";
import type { BrowserSessionState } from "./browser-session-state";

/**
 * Mutable page context update payload (Phase 70).
 */
export interface BrowserPageContextUpdate {
  readonly currentUrl?: string;
  readonly title?: string;
  readonly activeSelector?: string;
  readonly lastAction?: BrowserAction;
  readonly extractedContent?: string;
  readonly appendSnapshot?: boolean;
}

/**
 * Active browser page/session context (Phase 70).
 */
export interface BrowserPageContext {
  readonly contextId: string;
  readonly sessionId: string;
  readonly state: BrowserSessionState;
  readonly stub: boolean;
  readonly currentUrl?: string;
  readonly title?: string;
  readonly activeSelector?: string;
  readonly lastAction?: BrowserAction;
  readonly actionCount: number;
  readonly snapshots: readonly BrowserPageSnapshot[];
  readonly updatedAt: string;
}
