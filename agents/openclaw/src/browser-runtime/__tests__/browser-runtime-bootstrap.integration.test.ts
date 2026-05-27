import { describe, expect, it } from "vitest";

import { createOpenClawAdapterStub } from "../../../adapter/src/openclaw-adapter-stub";
import { DefaultOpenClawGateway } from "../../gateway/default-openclaw-gateway";
import { buildBrowserExecutionRequest } from "../build-browser-execution-request";
import {
  createBrowserRuntimeSession,
  createDefaultBrowserRuntimeBootstrap,
  runBrowserRuntimePath,
} from "../index";

const gatewayRequest = {
  requestId: "req-bootstrap-int-1",
  taskId: "task-bootstrap-int-1",
  userId: "user-1",
  intent: { kind: "automate" as const, description: "Open dashboard" },
  contextRef: "ctx-bootstrap-int-1",
  requestedActions: ["browser", "file"] as const,
};

describe("Browser runtime bootstrap integration", () => {
  it("runs bootstrap path through runBrowserRuntimePath", async () => {
    const bootstrap = createDefaultBrowserRuntimeBootstrap();
    const result = await runBrowserRuntimePath(
      buildBrowserExecutionRequest(gatewayRequest, "handle-stub-task-bootstrap-int-1"),
      undefined,
      { bootstrap },
    );

    expect(result.success).toBe(true);
    expect(result.stub).toBe(true);
    expect(result.status).toBe("completed");
  });

  it("preserves direct session stub path when session is injected", async () => {
    const session = createBrowserRuntimeSession();
    const result = await runBrowserRuntimePath(
      buildBrowserExecutionRequest(gatewayRequest, "handle-stub-task-bootstrap-int-2"),
      session,
    );

    expect(result.success).toBe(true);
    expect(result.message).toContain("stub-executed");
  });

  it("gateway executes browser path with bootstrap-backed default runtime", async () => {
    const gateway = new DefaultOpenClawGateway({
      env: { OPENCLAW_MODE: "stub" },
      adapter: createOpenClawAdapterStub(),
    });

    const response = await gateway.execute(gatewayRequest);
    expect(response.success).toBe(true);
    expect(response.approvedActions).toEqual(["browser", "file"]);
  });
});
