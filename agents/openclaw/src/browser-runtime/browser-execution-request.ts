import type { BrowserWorkflowStep } from "./browser-workflow-step";

/**
 * Browser execution request — OpenClaw runtime → browser boundary (Phase 61).
 */
export interface BrowserExecutionRequest {
  readonly taskId: string;
  readonly requestId: string;
  readonly action: string;
  readonly url: string;
  readonly handleId?: string;
  readonly selector?: string;
  readonly text?: string;
  readonly workflowSteps?: readonly BrowserWorkflowStep[];
  readonly stub?: boolean;
}
