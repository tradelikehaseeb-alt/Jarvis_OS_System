import type { BrowserAction } from "./browser-action";

/**
 * Single browser action execution result (Phase 69).
 */
export interface BrowserActionResult {
  readonly success: boolean;
  readonly stub: boolean;
  readonly action: BrowserAction;
  readonly status: "completed" | "failed" | "validated";
  readonly message: string;
  readonly executedAt: string;
  readonly url?: string;
  readonly selector?: string;
  readonly text?: string;
  readonly extractedContent?: string;
  readonly screenshotRef?: string | null;
}

/**
 * Multi-action pipeline execution result (Phase 69).
 */
export interface BrowserActionPipelineResult {
  readonly success: boolean;
  readonly stub: boolean;
  readonly results: readonly BrowserActionResult[];
  readonly executedAt: string;
  readonly message: string;
}
