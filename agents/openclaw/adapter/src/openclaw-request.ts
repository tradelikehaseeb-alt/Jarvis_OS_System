import type { TaskIntent } from "@jarvis/types";

/**
 * Input to {@link OpenClawAdapter.invoke} — execution gateway boundary (Phase 16).
 */
export interface OpenClawRequest {
  readonly requestId: string;
  readonly taskId: string;
  readonly userId: string;
  readonly intent: TaskIntent;
  readonly contextRef?: string;
  readonly correlationId?: string;
  readonly workflowStepId?: string;
  /**
   * Declared execution kinds for stub routing (e.g. browser, file).
   * Official adapter maps these to sandboxed gateway actions.
   */
  readonly requestedActions?: readonly string[];
}
