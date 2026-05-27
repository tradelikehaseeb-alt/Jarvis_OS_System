import { describe, expect, it } from "vitest";

import {
  DefaultHermesGateway,
  createDefaultHermesGateway,
} from "../index";
import { createHermesPlanningAdapter } from "../../index";

const request = {
  requestId: "req-gw-1",
  taskId: "task-gw-1",
  userId: "user-1",
  intent: { kind: "plan" as const, description: "Plan my week" },
  contextRef: "ctx-1",
};

describe("Hermes gateway", () => {
  it("validates stub runtime by default", async () => {
    const gateway = createDefaultHermesGateway({
      env: { HERMES_MODE: "stub" },
    });
    const validation = await gateway.validateRuntime();
    expect(validation.valid).toBe(true);
    expect(validation.status).toBe("stub");
    expect(validation.reasons).toEqual([]);
  });

  it("returns stub runtime status", async () => {
    const gateway = createDefaultHermesGateway({
      env: { HERMES_MODE: "stub" },
    });
    await expect(gateway.getRuntimeStatus()).resolves.toBe("stub");
  });

  it("executes through adapter stub boundary", async () => {
    const gateway = new DefaultHermesGateway({
      env: { HERMES_MODE: "stub" },
    });
    const response = await gateway.execute(request);

    expect(response.success).toBe(true);
    expect(response.stub).toBe(true);
    expect(response.runtimeStatus).toBe("stub");
    expect(response.plan.goal).toBe("Plan my week");
    expect(response.plan.steps.length).toBeGreaterThan(0);
  });

  it("executes through planning adapter when wired", async () => {
    const gateway = createDefaultHermesGateway({
      env: { HERMES_MODE: "stub" },
      adapter: createHermesPlanningAdapter(),
    });
    const response = await gateway.execute(request);

    expect(response.success).toBe(true);
    expect(response.stub).toBe(false);
    expect(response.plan.steps.length).toBeGreaterThanOrEqual(3);
  });

  it("rejects execution when runtime validation fails", async () => {
    const gateway = createDefaultHermesGateway({
      env: {
        HERMES_MODE: "local",
        HERMES_ENDPOINT: "http://127.0.0.1:59999",
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

describe("Hermes gateway integration", () => {
  it("agent execute includes gateway payload", async () => {
    const { createDefaultSkillPipeline } = await import("@jarvis/agents-shared");
    const { createHermesAgent } = await import("../../index");

    const { skillExecutor } = await createDefaultSkillPipeline();
    const agent = createHermesAgent(skillExecutor);
    const result = await agent.execute(
      {
        taskId: "task-int-1",
        requestId: "req-int-1",
        userId: "user-1",
        intent: { kind: "plan", description: "Plan sprint" },
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
      (result.payload?.planning as { runtimeStatus?: string }).runtimeStatus,
    ).toBe("stub");
  });
});
