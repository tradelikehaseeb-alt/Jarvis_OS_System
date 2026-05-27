import type { BrowserAction } from "./browser-action";

/**
 * Browser action execution request (Phase 69).
 */
export interface BrowserActionRequest {
  readonly action: BrowserAction;
  readonly taskId: string;
  readonly requestId: string;
  readonly url?: string;
  readonly selector?: string;
  readonly text?: string;
  readonly handleId?: string;
  readonly stub?: boolean;
}
