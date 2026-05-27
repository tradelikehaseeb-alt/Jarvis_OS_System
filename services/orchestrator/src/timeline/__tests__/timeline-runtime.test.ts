import { describe, expect, it, vi } from "vitest";

import { createDefaultActivityRuntime } from "../../activity/create-default-activity-runtime";
import { createDefaultStreamManager } from "../../streaming/create-default-stream-manager";
import { createDefaultTimelineRuntime } from "../create-default-timeline-runtime";
import { TIMELINE_EVENT_LABELS } from "../timeline-event";

describe("TimelineRuntime", () => {
  it("startTimeline captures activity stream events", () => {
    const streamManager = createDefaultStreamManager();
    const activityRuntime = createDefaultActivityRuntime({ streamManager });
    const timelineRuntime = createDefaultTimelineRuntime({ activityRuntime });

    timelineRuntime.startTimeline({
      timelineId: "timeline-task-1",
      streamSessionId: "stream-task-1",
      taskId: "task-1",
    });

    streamManager.publish({
      streamSessionId: "stream-task-1",
      sessionId: "sess-1",
      taskId: "task-1",
      userId: "user-1",
      type: "planning_started",
      message: "Hermes planning started",
      payload: { source: "hermes" },
    });

    const events = timelineRuntime.getEvents("timeline-task-1");
    expect(events.some((event) => event.kind === "planning_started")).toBe(true);
  });

  it("appendTimelineEvent notifies subscribers", () => {
    const streamManager = createDefaultStreamManager();
    const activityRuntime = createDefaultActivityRuntime({ streamManager });
    const timelineRuntime = createDefaultTimelineRuntime({ activityRuntime });
    const onEvent = vi.fn();

    timelineRuntime.startTimeline({
      timelineId: "timeline-task-2",
      streamSessionId: "stream-task-2",
      taskId: "task-2",
    });
    timelineRuntime.subscribeTimeline({ subscriberId: "test", onEvent });
    timelineRuntime.appendTimelineEvent({
      id: "manual-1",
      kind: "action_progress",
      label: TIMELINE_EVENT_LABELS.action_progress,
      message: "Opening dashboard",
      timestamp: "2026-05-27T12:00:00.000Z",
      status: "active",
      timelineId: "timeline-task-2",
      taskId: "task-2",
    });

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "action_progress" }),
    );
  });

  it("completeTimeline appends completion or failure event", () => {
    const streamManager = createDefaultStreamManager();
    const activityRuntime = createDefaultActivityRuntime({ streamManager });
    const timelineRuntime = createDefaultTimelineRuntime({ activityRuntime });

    timelineRuntime.startTimeline({
      timelineId: "timeline-task-3",
      streamSessionId: "stream-task-3",
      taskId: "task-3",
    });
    timelineRuntime.completeTimeline("timeline-task-3", true, "Done");

    expect(
      timelineRuntime.getEvents("timeline-task-3").some((event) => event.kind === "completed"),
    ).toBe(true);
  });
});
