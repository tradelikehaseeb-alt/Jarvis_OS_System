import { describe, expect, it } from "vitest";

import type { HermesRequest } from "../../../src/hermes-request";

import {
  HermesPlanningAdapter,
  createHermesPlanningAdapter,
} from "../hermes-planning-adapter";

const request: HermesRequest = {
  requestId: "req-plan-1",
  taskId: "task-plan-1",
  userId: "user-1",
  intent: { kind: "plan", description: "Organize Q2 roadmap" },
  contextRef: "ctx-1",
};

describe("HermesPlanningAdapter", () => {
  it("returns structured plan with goal and steps", async () => {
    const adapter = createHermesPlanningAdapter();
    const response = await adapter.invoke(request);

    expect(response.success).toBe(true);
    expect(response.stub).toBe(false);
    expect(response.adapterId).toBe("hermes-planning-adapter");
    expect(response.plan.goal).toBe("Organize Q2 roadmap");
    expect(response.plan.steps.length).toBeGreaterThanOrEqual(3);
    expect(response.plan.summary).toBe(response.plan.goal);
  });

  it("rejects stub mode configuration", async () => {
    const adapter = new HermesPlanningAdapter();
    const response = await adapter.invoke(request, {
      adapterId: "hermes-planning-adapter",
      mode: "stub",
    });

    expect(response.success).toBe(false);
    expect(response.error?.code).toBe("PLANNING_ADAPTER_MODE_MISMATCH");
  });

  it("does not expose memory or execution side effects in response", async () => {
    const response = await createHermesPlanningAdapter().invoke(request);
    expect(response.plan).toBeDefined();
    expect(JSON.stringify(response)).not.toMatch(/browser|openclaw|desktop/i);
  });
});
