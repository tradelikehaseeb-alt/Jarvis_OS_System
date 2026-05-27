import { describe, expect, it, vi } from "vitest";

import {
  createDefaultExecutionLifecycleManager,
  createTestOrchestratorService,
} from "../../index";

describe("execution handshake integration", () => {
  it("automate intent runs Hermes planning then OpenClaw execution lifecycle", async () => {
    const lifecycle = createDefaultExecutionLifecycleManager();
    const streamed: string[] = [];
    lifecycle.subscribeActivities((activity) => {
      streamed.push(`${activity.source}:${activity.kind}`);
    });

    const service = await createTestOrchestratorService();
    const { record } = await service.executeCreateTask(
      {
        intent: { kind: "automate", description: "Open dashboard" },
      },
      { lifecycleManager: lifecycle },
    );

    expect(record.createTaskResponse.status).toBe("completed");

    const lifecycleOutput = record.taskStatus.output?.executionLifecycle as {
      state: string;
      handshake?: { planningAgentId: string; executionAgentId: string };
      activities: { source: string; kind: string }[];
    };

    expect(lifecycleOutput.state).toBe("completed");
    expect(lifecycleOutput.handshake).toEqual({
      planningAgentId: "hermes",
      executionAgentId: "openclaw-gateway",
    });

    const hermesActivities = lifecycleOutput.activities.filter(
      (a) => a.source === "hermes",
    );
    const openclawActivities = lifecycleOutput.activities.filter(
      (a) => a.source === "openclaw",
    );

    expect(hermesActivities.some((a) => a.kind === "plan_generated")).toBe(true);
    expect(openclawActivities.some((a) => a.kind === "execution_completed")).toBe(
      true,
    );
    expect(streamed.some((s) => s.startsWith("hermes:"))).toBe(true);
    expect(streamed.some((s) => s.startsWith("openclaw:"))).toBe(true);

    expect(record.taskStatus.output?.planningPayload).toBeDefined();
    expect(
      (record.taskStatus.output?.skill as { skillIds: string[] }).skillIds,
    ).toContain("browser-skill");
  });

  it("plan intent emits Hermes planning activities only", async () => {
    const lifecycle = createDefaultExecutionLifecycleManager();
    const service = await createTestOrchestratorService();

    const { record } = await service.executeCreateTask(
      { intent: { kind: "plan", description: "Plan sprint" } },
      { lifecycleManager: lifecycle },
    );

    const lifecycleOutput = record.taskStatus.output?.executionLifecycle as {
      state: string;
      activities: { source: string }[];
    };

    expect(lifecycleOutput.state).toBe("completed");
    expect(
      lifecycleOutput.activities.some((a) => a.source === "hermes"),
    ).toBe(true);
    expect(
      lifecycleOutput.activities.some((a) => a.source === "openclaw"),
    ).toBe(false);
    expect(record.taskStatus.output?.planningPayload).toBeUndefined();
  });
});
