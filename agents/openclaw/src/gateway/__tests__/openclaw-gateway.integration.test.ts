import { describe, expect, it } from "vitest";

import {
  DefaultOpenClawGateway,
  createDefaultOpenClawGateway,
} from "../index";

const request = {
  requestId: "req-gw-1",
  taskId: "task-gw-1",
  userId: "user-1",
  intent: { kind: "automate" as const, description: "Open dashboard" },
  contextRef: "ctx-1",
  requestedActions: ["browser", "file"] as const,
};

describe("OpenClaw gateway", () => {
  it("validates stub runtime by default", async () => {
    const gateway = createDefaultOpenClawGateway({
      env: { OPENCLAW_MODE: "stub" },
    });
    const validation = await gateway.validateRuntime();
    expect(validation.valid).toBe(true);
    expect(validation.status).toBe("stub");
    expect(validation.reasons).toEqual([]);
  });

  it("returns stub runtime status", async () => {
    const gateway = createDefaultOpenClawGateway({
      env: { OPENCLAW_MODE: "stub" },
    });
    await expect(gateway.getRuntimeStatus()).resolves.toBe("stub");
  });

  it("executes through adapter stub boundary", async () => {
    const gateway = new DefaultOpenClawGateway({
      env: { OPENCLAW_MODE: "stub" },
    });
    const response = await gateway.execute(request);

    expect(response.success).toBe(true);
    expect(response.stub).toBe(true);
    expect(response.runtimeStatus).toBe("stub");
    expect(response.executionHandleId).toBe("handle-stub-task-gw-1");
    expect(response.approvedActions).toEqual(["browser", "file"]);
  });

  it("rejects execution when runtime validation fails", async () => {
    const gateway = createDefaultOpenClawGateway({
      env: {
        OPENCLAW_MODE: "local",
        OPENCLAW_ENDPOINT: "http://127.0.0.1:59999",
      },
      allowNetworkProbe: false,
    });

    const validation = await gateway.validateRuntime();
    expect(validation.valid).toBe(false);

    const response = await gateway.execute(request);
    expect(response.success).toBe(false);
    expect(response.error?.code).toBe("RUNTIME_UNAVAILABLE");
  });
});

describe("OpenClaw gateway integration", () => {
  it("agent execute includes gateway payload", async () => {
    const { createDefaultSkillPipeline } = await import("@jarvis/agents-shared");
    const { createOpenClawAgent } = await import("../../index");

    const { skillExecutor } = await createDefaultSkillPipeline();
    const agent = createOpenClawAgent(skillExecutor);
    const result = await agent.execute(
      {
        taskId: "task-int-1",
        requestId: "req-int-1",
        userId: "user-1",
        intent: { kind: "automate", description: "Run task" },
        workflowStepId: "step-1",
      },
      { contextRef: "ctx-int-1", userId: "user-1" },
    );

    expect(result.success).toBe(true);
    expect(result.payload?.gateway).toMatchObject({
      stub: true,
      runtimeStatus: "stub",
    });
    expect(
      (result.payload?.execution as { runtimeStatus?: string }).runtimeStatus,
    ).toBe("stub");
  });
});
