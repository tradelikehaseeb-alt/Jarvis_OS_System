import { describe, expect, it } from "vitest";

import { mapActivityStreamToEvents } from "../map-activity-stream-events";

describe("mapActivityStreamToEvents", () => {
  it("maps orchestrator activity stream events to timeline entries", () => {
    const events = mapActivityStreamToEvents([
      {
        eventId: "evt-1",
        type: "planning_started",
        timestamp: "2026-01-01T00:00:01.000Z",
        message: "Planning",
        source: "hermes",
      },
      {
        eventId: "evt-2",
        type: "execution_started",
        timestamp: "2026-01-01T00:00:02.000Z",
        message: "Executing",
        source: "openclaw",
      },
    ]);

    expect(events).toHaveLength(2);
    expect(events[0]?.kind).toBe("planning_started");
    expect(events[1]?.kind).toBe("execution_started");
    expect(events[1]?.message).toBe("Executing");
  });
});
