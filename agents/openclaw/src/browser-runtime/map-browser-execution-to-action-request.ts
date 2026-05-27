import type { BrowserExecutionRequest } from "./browser-execution-request";
import { resolveBrowserAction } from "./browser-action";
import type { BrowserActionRequest } from "./browser-action-request";

/**
 * Maps a {@link BrowserExecutionRequest} to a pipeline action request (Phase 69).
 */
export function mapBrowserExecutionToActionRequest(
  request: BrowserExecutionRequest,
): BrowserActionRequest | undefined {
  const action = resolveBrowserAction(request.action);
  if (!action) {
    return undefined;
  }

  return {
    action,
    taskId: request.taskId,
    requestId: request.requestId,
    url: request.url,
    handleId: request.handleId,
    stub: request.stub,
  };
}
