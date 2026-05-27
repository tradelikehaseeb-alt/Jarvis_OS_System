import { describe, expect, it } from "vitest";

import { createTestOrchestratorService } from "../../index";

describe("Activity stream integration", () => {
  it("includes live activity stream events in task output", async () => {
    const service = await createTestOrchestratorService();

    const { record } = await service.executeCreateTask({
      intent: { kind: "plan", description: "Plan sprint backlog" },
    });

    const output = record.taskStatus.output ?? {};
    const activityStream = output.activityStream as {
      streamSessionId?: string;
      events?: readonly { type: string; source?: string }[];
    };

    expect(activityStream.streamSessionId).toMatch(/^stream-task-/);
    expect(activityStream.events?.length ?? 0).toBeGreaterThan(0);
    expect(activityStream.events?.some((e) => e.type === "planning_started")).toBe(
      true,
    );
    expect(activityStream.events?.some((e) => e.type === "execution_started")).toBe(
      true,
    );

    const streamEvents = output.streamEvents as readonly { type: string }[];
    expect(streamEvents.some((e) => e.type === "planning_started")).toBe(true);
  });

  it("captures OpenClaw automate activity for handshake tasks", async () => {
    const service = await createTestOrchestratorService();

    const { record } = await service.executeCreateTask({
      intent: { kind: "automate", description: "Open dashboard" },
    });

    const activityStream = record.taskStatus.output?.activityStream as {
      events?: readonly { type: string; source?: string }[];
    };

    expect(
      activityStream.events?.some(
        (event) =>
          event.type === "planning_completed" || event.type === "execution_started",
      ),
    ).toBe(true);
  });
});
