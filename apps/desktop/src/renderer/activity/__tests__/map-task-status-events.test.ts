import { describe, expect, it } from "vitest";

import { mapTaskStatusToActivityEvents } from "../map-task-status-events";

describe("mapTaskStatusToActivityEvents", () => {
  it("maps execution lifecycle activities and memory output", () => {
    const events = mapTaskStatusToActivityEvents({
      taskId: "task-1",
      status: "completed",
      updatedAt: "2026-01-01T00:00:05.000Z",
      output: {
        executionLifecycle: {
          sessionId: "exec-session-task-1",
          state: "completed",
          activityCount: 2,
          events: [
            {
              kind: "session_started",
              state: "queued",
              message: "Execution session queued",
              timestamp: "2026-01-01T00:00:01.000Z",
            },
            {
              kind: "activity",
              state: "planning",
              activity: {
                kind: "planning_completed",
                summary: "Hermes planning completed",
                timestamp: "2026-01-01T00:00:02.000Z",
              },
            },
          ],
          activities: [
            {
              kind: "planning_started",
              summary: "Hermes planning started",
              timestamp: "2026-01-01T00:00:01.500Z",
              source: "hermes",
            },
          ],
        },
        memory: {
          summary: "Memory summary for user",
          conversationId: "conv-1",
          historyCount: 4,
        },
      },
    });

    expect(events.some((e) => e.kind === "execution_started")).toBe(true);
    expect(events.some((e) => e.kind === "planning_started")).toBe(true);
    expect(events.some((e) => e.kind === "planning_completed")).toBe(true);
    expect(events.some((e) => e.kind === "memory_saved")).toBe(true);
    expect(events.some((e) => e.kind === "conversation_updated")).toBe(true);
  });

  it("maps failed task status to error event", () => {
    const events = mapTaskStatusToActivityEvents({
      taskId: "task-2",
      status: "failed",
      updatedAt: "2026-01-01T00:00:01.000Z",
      error: { code: "AGENT_NOT_FOUND", message: "Agent missing" },
    });

    expect(events).toHaveLength(1);
    expect(events[0]?.kind).toBe("failed");
    expect(events[0]?.status).toBe("error");
  });
});
