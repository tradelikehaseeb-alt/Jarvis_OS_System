import type { TaskStatusResponse } from "@jarvis/types";

import {
  ACTIVITY_EVENT_LABELS,
  type ActivityEvent,
  type ActivityEventKind,
} from "./activity-event";
import { mapActivityStreamToEvents } from "./map-activity-stream-events";

let eventCounter = 0;

function nextEventId(prefix: string): string {
  eventCounter += 1;
  return `${prefix}-${eventCounter}`;
}

function createEvent(
  kind: ActivityEventKind,
  message?: string,
  timestamp?: string,
  status: ActivityEvent["status"] = "complete",
): ActivityEvent {
  return {
    id: nextEventId(kind),
    kind,
    label: ACTIVITY_EVENT_LABELS[kind],
    message,
    timestamp: timestamp ?? new Date().toISOString(),
    status,
  };
}

function mapStateToKind(state: string): ActivityEventKind | undefined {
  switch (state) {
    case "planning":
      return "planning_started";
    case "executing":
      return "execution_started";
    case "completed":
      return "execution_completed";
    case "failed":
      return "failed";
    default:
      return undefined;
  }
}

function mapActivityKind(kind: string): ActivityEventKind | undefined {
  switch (kind) {
    case "planning_started":
      return "planning_started";
    case "planning_completed":
      return "planning_completed";
    case "execution_started":
      return "execution_started";
    case "execution_completed":
      return "execution_completed";
    default:
      return undefined;
  }
}

function mapStreamType(type: string): ActivityEventKind | undefined {
  switch (type) {
    case "execution_started":
      return "execution_started";
    case "planning_started":
      return "planning_started";
    case "planning_completed":
      return "planning_completed";
    case "execution_completed":
      return "execution_completed";
    case "memory_saved":
      return "memory_saved";
    case "conversation_updated":
      return "conversation_updated";
    case "failed":
      return "failed";
    default:
      return undefined;
  }
}

/**
 * Map orchestrator task output (execution lifecycle + memory) to timeline events.
 */
export function mapTaskStatusToActivityEvents(
  status: TaskStatusResponse,
): ActivityEvent[] {
  const output = status.output;
  if (!output) {
    if (status.status === "failed") {
      return [
        createEvent(
          "failed",
          status.error?.message ?? "Task failed",
          status.updatedAt,
          "error",
        ),
      ];
    }
    return [];
  }

  const events: ActivityEvent[] = [];
  const seen = new Set<string>();

  const push = (event: ActivityEvent): void => {
    const key = `${event.kind}:${event.message ?? ""}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    events.push(event);
  };

  const lifecycle = output.executionLifecycle as
    | {
        events?: readonly {
          kind?: string;
          state?: string;
          message?: string;
          timestamp?: string;
          activity?: { kind?: string; summary?: string; timestamp?: string };
        }[];
        activities?: readonly {
          kind?: string;
          summary?: string;
          timestamp?: string;
          source?: string;
        }[];
      }
    | undefined;

  for (const evt of lifecycle?.events ?? []) {
    if (evt.kind === "activity" && evt.activity?.kind) {
      const kind = mapActivityKind(evt.activity.kind);
      if (kind) {
        push(
          createEvent(
            kind,
            evt.activity.summary ?? evt.message,
            evt.activity.timestamp ?? evt.timestamp,
          ),
        );
      }
      continue;
    }

    if (evt.kind === "state_changed") {
      const kind = mapStateToKind(String(evt.state ?? ""));
      if (kind) {
        push(createEvent(kind, evt.message, evt.timestamp));
      }
      continue;
    }

    if (evt.kind === "session_started") {
      push(createEvent("execution_started", evt.message, evt.timestamp));
      continue;
    }

    if (evt.kind === "session_failed") {
      push(
        createEvent(
          "failed",
          evt.message ?? "Execution failed",
          evt.timestamp,
          "error",
        ),
      );
    }

    if (evt.kind === "session_completed") {
      push(
        createEvent(
          "execution_completed",
          evt.message ?? "Execution completed",
          evt.timestamp,
        ),
      );
    }
  }

  for (const activity of lifecycle?.activities ?? []) {
    const kind = mapActivityKind(String(activity.kind ?? ""));
    if (kind) {
      push(
        createEvent(
          kind,
          activity.summary,
          activity.timestamp,
        ),
      );
    }
  }

  if (output.memory) {
    const memory = output.memory as {
      summary?: string;
      conversationId?: string;
      historyCount?: number;
    };
    push(
      createEvent(
        "memory_saved",
        memory.summary
          ? `Stored ${memory.historyCount ?? 0} memory records`
          : "Execution memory persisted",
        status.updatedAt,
      ),
    );
    push(
      createEvent(
        "conversation_updated",
        memory.conversationId
          ? `Conversation ${memory.conversationId} updated`
          : "Conversation history updated",
        status.updatedAt,
      ),
    );
  }

  const activityStream = output.activityStream as
    | {
        events?: readonly {
          eventId?: string;
          type?: string;
          message?: string;
          timestamp?: string;
          source?: string;
        }[];
      }
    | undefined;

  if (activityStream?.events?.length) {
    for (const event of mapActivityStreamToEvents(
      activityStream.events.map((entry) => ({
        eventId: entry.eventId,
        type: String(entry.type ?? ""),
        timestamp: entry.timestamp ?? status.updatedAt,
        message: entry.message,
        source: entry.source,
      })),
    )) {
      push(event);
    }
  }

  const streamEvents = output.streamEvents as
    | readonly { type?: string; message?: string; timestamp?: string }[]
    | undefined;

  for (const streamEvt of streamEvents ?? []) {
    const kind = mapStreamType(String(streamEvt.type ?? ""));
    if (kind) {
      push(
        createEvent(
          kind,
          streamEvt.message,
          streamEvt.timestamp ?? status.updatedAt,
          kind === "failed" ? "error" : "complete",
        ),
      );
    }
  }

  if (status.status === "failed" && !events.some((e) => e.kind === "failed")) {
    push(
      createEvent(
        "failed",
        status.error?.message ?? "Task failed",
        status.updatedAt,
        "error",
      ),
    );
  }

  return events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
