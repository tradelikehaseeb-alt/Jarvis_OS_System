import { describe, expect, it } from "vitest";

import { createTestOrchestratorService } from "@jarvis/orchestrator";

import {
  mapActivityEventsToTimelineSteps,
  mapExecutionTimelineToSteps,
} from "../map-activity-to-timeline-steps";
import { mapActivityStreamToEvents } from "../../activity/map-activity-stream-events";

describe("execution timeline integration", () => {
  it("maps orchestrator activity stream to desktop timeline steps", async () => {
    const service = await createTestOrchestratorService();
    const { record } = await service.executeCreateTask({
      intent: { kind: "plan", description: "Plan weekly tasks" },
    });

    const activityStream = record.taskStatus.output?.activityStream as {
      events?: readonly { type: string; timestamp: string; message?: string }[];
    };
    const executionTimeline = record.taskStatus.output?.executionTimeline as {
      events?: readonly { kind: string; timestamp: string; label?: string }[];
    };

    const activityEvents = mapActivityStreamToEvents(activityStream.events ?? []);
    const fromActivity = mapActivityEventsToTimelineSteps(activityEvents);
    const fromTimeline = mapExecutionTimelineToSteps(executionTimeline.events ?? []);

    expect(fromActivity.length).toBeGreaterThan(0);
    expect(fromTimeline.some((step) => step.kind === "planning_started")).toBe(true);
    expect(
      fromTimeline.some(
        (step) => step.kind === "completed" || step.kind === "execution_started",
      ),
    ).toBe(true);
  });
});
