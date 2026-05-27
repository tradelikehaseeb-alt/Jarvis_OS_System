/**
 * Browser execution result — validation/execution path only (Phase 61).
 */
export interface BrowserExecutionResult {
  readonly success: boolean;
  readonly stub: boolean;
  readonly action: string;
  readonly url: string;
  readonly status: "completed" | "failed" | "validated";
  readonly message: string;
  readonly executedAt: string;
  readonly screenshotRef?: string | null;
}
