import { describe, expect, it } from "vitest";

import { GROQ_PLANNING_ADAPTER_TEST_OPTIONS } from "../../../adapter/official/src/__tests__/groq-planning-mock";
import {
  buildHermesStructuredPlan,
  createDefaultHermesExecutionBridge,
  createHermesPlanningAdapter,
} from "../../index";
import type { HermesRequest } from "../../../adapter/src/hermes-request";

const request: HermesRequest = {
  userId: "user-1",
  intent: { kind: "automate", description: "Open dashboard and export report" },
};

describe("HermesExecutionBridge runtime", () => {
  const bridge = createDefaultHermesExecutionBridge();

  it("createExecutionPlan maps structured plan steps", () => {
    const structured = buildHermesStructuredPlan(request);
    const plan = bridge.createExecutionPlan({
      parentTaskId: "task-1",
      structuredPlan: structured,
    });

    expect(plan.planId).toBe("exec-plan-task-1");
    expect(plan.goal).toContain("Open dashboard");
    expect(plan.steps.length).toBeGreaterThan(0);
    expect(plan.steps[0]?.index).toBe(0);
    expect(plan.source).toBe("structured_plan");
  });

  it("mapPlanToTasks produces automate intents for each step", () => {
    const structured = buildHermesStructuredPlan(request);
    const plan = bridge.createExecutionPlan({
      parentTaskId: "task-2",
      structuredPlan: structured,
    });

    const tasks = bridge.mapPlanToTasks({
      plan,
      parentTaskId: "task-2",
      userId: "user-1",
    });

    expect(tasks.length).toBe(plan.steps.length);
    expect(tasks.every((task) => task.intent.kind === "automate")).toBe(true);
    expect(tasks[0]?.metadata?.executionBridge).toBe(true);
  });

  it("uses stub fallback when agent payload has no plan", () => {
    const plan = bridge.createExecutionPlan({
      parentTaskId: "task-stub",
      agentPayload: { stub: true },
    });

    expect(plan.stub).toBe(true);
    expect(plan.source).toBe("stub_fallback");
    expect(plan.steps.length).toBe(3);
  });

  it("detects stub from planning adapter payload shape", async () => {
    const adapter = createHermesPlanningAdapter(GROQ_PLANNING_ADAPTER_TEST_OPTIONS);
    const response = await adapter.invoke(request);
    const plan = bridge.createExecutionPlan({
      parentTaskId: "task-adapter",
      agentPayload: {
        stub: response.stub,
        structuredPlan: { goal: response.plan.goal, steps: response.plan.steps },
        gateway: { stub: response.stub },
      },
    });

    expect(plan.steps.length).toBe(response.plan.steps.length);
    expect(plan.goal).toBe(response.plan.goal);
  });
});
