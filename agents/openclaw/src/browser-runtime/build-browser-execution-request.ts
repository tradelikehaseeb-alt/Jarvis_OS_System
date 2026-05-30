import type { OpenClawGatewayRequest } from "../gateway/openclaw-gateway-request";
import { parseBrowserIntent } from "../execution-runtime/parse-browser-intent";
import { isRealBrowserExecutionEnabled } from "../execution-runtime/browser-real-mode";

import type { BrowserExecutionRequest } from "./browser-execution-request";

/**
 * Builds a browser execution request from an OpenClaw gateway request (Phase 61 / 95).
 */
export function buildBrowserExecutionRequest(
  request: OpenClawGatewayRequest,
  handleId?: string,
): BrowserExecutionRequest {
  const stub = !isRealBrowserExecutionEnabled(process.env);
  const parsed = parseBrowserIntent(request.intent.description);

  return {
    taskId: request.taskId,
    requestId: request.requestId,
    action: parsed.action,
    url: parsed.url,
    handleId,
    workflowSteps: parsed.workflowSteps,
    stub,
  };
}
