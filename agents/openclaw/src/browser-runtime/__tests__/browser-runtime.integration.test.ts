import { describe, expect, it } from "vitest";

import { createOpenClawAdapterStub } from "../../../adapter/src/openclaw-adapter-stub";
import { DefaultOpenClawGateway } from "../../gateway/default-openclaw-gateway";
import { buildBrowserExecutionRequest } from "../build-browser-execution-request";
import {
  createBrowserRuntimeSession,
  runBrowserRuntimePath,
} from "../create-browser-runtime-session";

const gatewayRequest = {
  requestId: "req-browser-int-1",
  taskId: "task-browser-int-1",
  userId: "user-1",
  intent: { kind: "automate" as const, description: "Open dashboard" },
  contextRef: "ctx-browser-int-1",
  requestedActions: ["browser", "file"] as const,
};

describe("Browser runtime integration", () => {
  it("runs browser runtime path independently", async () => {
    const result = await runBrowserRuntimePath(
      buildBrowserExecutionRequest(gatewayRequest, "handle-stub-task-browser-int-1"),
    );

    expect(result.success).toBe(true);
    expect(result.stub).toBe(true);
    expect(["navigate", "workflow"]).toContain(result.action);
  });

  it("gateway executes browser runtime path for browser actions", async () => {
    const browserSession = createBrowserRuntimeSession();
    const gateway = new DefaultOpenClawGateway({
      env: { OPENCLAW_MODE: "stub" },
      adapter: createOpenClawAdapterStub(),
      browserRuntimeSession: browserSession,
    });

    const response = await gateway.execute(gatewayRequest);
    expect(response.success).toBe(true);
    expect(response.approvedActions).toEqual(["browser", "file"]);
  });
});
