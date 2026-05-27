import { describe, expect, it } from "vitest";

import { createDefaultHermesExecutionBridge } from "../../execution-bridge";
import { resolveHermesLiveExecutionPlanHint } from "../live-execution-plan-hint";

describe("Hermes live execution integration", () => {
  it("maps live command hint into Hermes execution plan", () => {
    const hint = resolveHermesLiveExecutionPlanHint("Search gold price today");
    expect(hint).toBeDefined();

    const bridge = createDefaultHermesExecutionBridge();
    const plan = bridge.createExecutionPlan({
      parentTaskId: "task-live-1",
      agentPayload: {
        structuredPlan: {
          goal: hint!.goal,
          steps: ["search-web", "summarize-results"],
        },
      },
    });

    const tasks = bridge.mapPlanToTasks({
      plan,
      parentTaskId: "task-live-1",
      userId: "user-live-1",
    });

    expect(plan.steps.length).toBeGreaterThan(0);
    expect(tasks[0]?.intent.description).toContain("Search gold price today");
  });
});
