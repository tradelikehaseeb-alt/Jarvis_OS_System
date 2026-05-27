import type { OpenClawGatewayRequest } from "../gateway/openclaw-gateway-request";

import type { BrowserExecutionRequest } from "./browser-execution-request";

/**
 * Builds a browser execution request from an OpenClaw gateway request (Phase 61).
 */
export function buildBrowserExecutionRequest(
  request: OpenClawGatewayRequest,
  handleId?: string,
): BrowserExecutionRequest {
  return {
    taskId: request.taskId,
    requestId: request.requestId,
    action: "navigate",
    url: "https://stub.local/task",
    handleId,
    stub: true,
  };
}
