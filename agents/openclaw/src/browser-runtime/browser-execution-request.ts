/**
 * Browser execution request — OpenClaw runtime → browser boundary (Phase 61).
 */
export interface BrowserExecutionRequest {
  readonly taskId: string;
  readonly requestId: string;
  readonly action: string;
  readonly url: string;
  readonly handleId?: string;
  readonly stub?: boolean;
}
