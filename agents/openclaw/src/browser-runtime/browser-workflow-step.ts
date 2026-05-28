import type { BrowserAction } from "./browser-action";

/**
 * Single step in a multi-action browser workflow (Phase 95).
 */
export interface BrowserWorkflowStep {
  readonly action: BrowserAction | string;
  readonly url?: string;
  readonly selector?: string;
  readonly text?: string;
}
