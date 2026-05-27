import { describe, expect, it } from "vitest";

import { createTestOrchestratorService } from "../../index";

describe("timeline integration", () => {
  it("includes execution timeline events in task output", async () => {
    const service = await createTestOrchestratorService();

    const { record } = await service.executeCreateTask({
      intent: { kind: "automate", description: "Open dashboard" },
    });

    const executionTimeline = record.taskStatus.output?.executionTimeline as {
      timelineId?: string;
      events?: readonly { kind: string }[];
    };

    expect(executionTimeline.timelineId).toBeDefined();
    expect(executionTimeline.events?.length ?? 0).toBeGreaterThan(0);
    expect(
      executionTimeline.events?.some((event) => event.kind === "planning_started"),
    ).toBe(true);
    expect(
      executionTimeline.events?.some(
        (event) => event.kind === "completed" || event.kind === "execution_started",
      ),
    ).toBe(true);
  });
});
