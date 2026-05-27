import { describe, expect, it } from "vitest";

import { createOpenClawAdapterStub } from "../../../adapter/src/openclaw-adapter-stub";
import { DefaultOpenClawGateway } from "../../gateway/default-openclaw-gateway";
import { buildBrowserExecutionRequest } from "../build-browser-execution-request";
import {
  createBrowserRuntimeSession,
  createDefaultBrowserActionPipeline,
  runBrowserRuntimePath,
} from "../index";

const gatewayRequest = {
  requestId: "req-action-pipeline-int-1",
  taskId: "task-action-pipeline-int-1",
  userId: "user-1",
  intent: { kind: "automate" as const, description: "Open dashboard" },
  contextRef: "ctx-action-pipeline-int-1",
  requestedActions: ["browser", "file"] as const,
};

describe("Browser action pipeline integration", () => {
  it("routes browser execution through action pipeline in session", async () => {
    const pipeline = createDefaultBrowserActionPipeline();
    const session = createBrowserRuntimeSession({ actionPipeline: pipeline });

    await session.initializeSession();
    await session.validateBrowser();

    const result = await session.executeBrowserTask(
      buildBrowserExecutionRequest(gatewayRequest, "handle-stub-task-action-pipeline-int-1"),
    );

    expect(result.success).toBe(true);
    expect(result.message).toContain("open-page");
    expect(result.message).toContain("stub-executed");
  });

  it("runs full browser runtime path with pipeline-backed session", async () => {
    const session = createBrowserRuntimeSession();
    const result = await runBrowserRuntimePath(
      buildBrowserExecutionRequest(gatewayRequest, "handle-stub-task-action-pipeline-int-2"),
      session,
    );

    expect(result.success).toBe(true);
    expect(result.status).toBe("completed");
  });

  it("gateway path remains compatible with pipeline-backed runtime", async () => {
    const gateway = new DefaultOpenClawGateway({
      env: { OPENCLAW_MODE: "stub" },
      adapter: createOpenClawAdapterStub(),
      browserRuntimeSession: createBrowserRuntimeSession(),
    });

    const response = await gateway.execute(gatewayRequest);
    expect(response.success).toBe(true);
    expect(response.approvedActions).toEqual(["browser", "file"]);
  });
});
