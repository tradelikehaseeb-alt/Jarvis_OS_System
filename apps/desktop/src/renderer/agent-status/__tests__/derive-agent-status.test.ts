import { describe, expect, it } from "vitest";

import type { ActivityEvent } from "../../activity/activity-event";
import { deriveAgentStatus, deriveAgentStatusEvents } from "../derive-agent-status";

function activity(
  kind: ActivityEvent["kind"],
  status: ActivityEvent["status"] = "complete",
): ActivityEvent {
  return {
    id: `evt-${kind}`,
    kind,
    label: kind,
    timestamp: "2026-01-01T00:00:01.000Z",
    status,
  };
}

describe("deriveAgentStatus", () => {
  it("maps planning and execution activity to agent states", () => {
    const status = deriveAgentStatus(
      [
        activity("planning_started", "complete"),
        activity("planning_completed", "complete"),
        activity("execution_started", "active"),
      ],
      true,
    );

    expect(status.hermes).toBe("completed");
    expect(status.openClaw).toBe("executing");
    expect(status.displayMessage).toContain("Performing task");
  });

  it("shows memory updating state", () => {
    const status = deriveAgentStatus(
      [activity("memory_saved", "active")],
      true,
    );

    expect(status.memoryUpdating).toBe(true);
    expect(status.displayMessage).toBe("Memory updating…");
  });

  it("maps failed events to error display", () => {
    const status = deriveAgentStatus(
      [
        activity("planning_started", "complete"),
        { ...activity("failed", "error"), message: "Agent missing" },
      ],
      false,
    );

    expect(status.hermes).toBe("failed");
    expect(status.error).toBe("Agent missing");
  });
});

describe("deriveAgentStatusEvents", () => {
  it("creates agent status events from activity stream", () => {
    const events = deriveAgentStatusEvents([
      activity("planning_started"),
      activity("execution_started"),
      activity("execution_completed"),
    ]);

    expect(events.some((e) => e.kind === "hermes_planning")).toBe(true);
    expect(events.some((e) => e.kind === "openclaw_executing")).toBe(true);
    expect(events.some((e) => e.kind === "task_completed")).toBe(true);
  });
});
