import type { ActivityStreamEvent } from "../activity/activity-stream-event";

import {
  TIMELINE_EVENT_LABELS,
  type TimelineEvent,
  type TimelineEventKind,
  type TimelineStepStatus,
} from "./timeline-event";

let eventCounter = 0;

function nextTimelineEventId(kind: string): string {
  eventCounter += 1;
  return `timeline-${kind}-${eventCounter}`;
}

function statusForKind(kind: TimelineEventKind): TimelineStepStatus {
  if (kind === "failed") {
    return "error";
  }
  if (kind === "completed") {
    return "complete";
  }
  return "complete";
}

function mapStreamType(type: string): TimelineEventKind | undefined {
  switch (type) {
    case "planning_started":
      return "planning_started";
    case "planning_completed":
      return "planning_completed";
    case "execution_started":
      return "execution_started";
    case "execution_completed":
      return "completed";
    case "failed":
      return "failed";
    default:
      return undefined;
  }
}

function readProgressMessage(
  event: ActivityStreamEvent,
): string | undefined {
  const runtimeStatus = event.payload?.runtimeStatus;
  if (runtimeStatus !== undefined) {
    return `Runtime status: ${String(runtimeStatus)}`;
  }

  if (event.message?.toLowerCase().includes("progress")) {
    return event.message;
  }

  return event.message;
}

/**
 * Maps {@link ActivityStreamEvent} to {@link TimelineEvent} without duplicating stream storage.
 */
export function toTimelineEvent(
  event: ActivityStreamEvent,
  timelineId: string,
): TimelineEvent | undefined {
  const progressMessage = readProgressMessage(event);
  if (
    progressMessage &&
    event.payload?.runtimeStatus !== undefined &&
    event.type !== "planning_started" &&
    event.type !== "planning_completed"
  ) {
    return {
      id: event.eventId ?? nextTimelineEventId("action_progress"),
      kind: "action_progress",
      label: TIMELINE_EVENT_LABELS.action_progress,
      message: progressMessage,
      timestamp: event.timestamp,
      status: "active",
      timelineId,
      taskId: event.taskId,
    };
  }

  const kind = mapStreamType(event.type);
  if (!kind) {
    return undefined;
  }

  return {
    id: event.eventId ?? nextTimelineEventId(kind),
    kind,
    label: TIMELINE_EVENT_LABELS[kind],
    message: event.message ?? event.source,
    timestamp: event.timestamp,
    status: statusForKind(kind),
    timelineId,
    taskId: event.taskId,
  };
}
