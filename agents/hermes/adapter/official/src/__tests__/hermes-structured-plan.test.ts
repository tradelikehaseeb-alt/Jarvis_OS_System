import { describe, expect, it } from "vitest";

import type { HermesRequest } from "../../../src/hermes-request";

import { buildHermesStructuredPlan } from "../hermes-structured-plan";

const baseRequest: HermesRequest = {
  requestId: "req-1",
  taskId: "task-1",
  userId: "user-1",
  intent: { kind: "plan", description: "Plan my week" },
};

describe("buildHermesStructuredPlan", () => {
  it("uses task description as goal", () => {
    const plan = buildHermesStructuredPlan(baseRequest);
    expect(plan.goal).toBe("Plan my week");
    expect(plan.steps.length).toBeGreaterThanOrEqual(3);
  });

  it("returns plan-specific steps for plan intent", () => {
    const plan = buildHermesStructuredPlan(baseRequest);
    expect(plan.steps[0]).toContain("scope");
  });

  it("falls back to default steps for unknown intent kinds", () => {
    const plan = buildHermesStructuredPlan({
      ...baseRequest,
      intent: { kind: "custom", description: "Do something new" },
    });
    expect(plan.goal).toBe("Do something new");
    expect(plan.steps.some((s) => s.includes("Jarvis skills"))).toBe(true);
  });
});
