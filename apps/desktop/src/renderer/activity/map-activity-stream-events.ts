import {
  ACTIVITY_EVENT_LABELS,
  type ActivityEvent,
  type ActivityEventKind,
} from "./activity-event";

/**
 * Orchestrator activity stream event shape from task output (Phase 71).
 */
export interface ActivityStreamEventPayload {
  readonly eventId?: string;
  readonly type: string;
  readonly timestamp: string;
  readonly message?: string;
  readonly source?: string;
}

let streamEventCounter = 0;

function nextStreamEventId(type: string): string {
  streamEventCounter += 1;
  return `activity-stream-${type}-${streamEventCounter}`;
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
 * Maps orchestrator {@link ActivityStreamEvent} payloads to desktop timeline events.
 */
export function mapActivityStreamToEvents(
  events: readonly ActivityStreamEventPayload[],
): ActivityEvent[] {
  const mapped: ActivityEvent[] = [];

  for (const event of events) {
    const kind = mapStreamType(event.type);
    if (!kind) {
      continue;
    }

    mapped.push({
      id: event.eventId ?? nextStreamEventId(kind),
      kind,
      label: ACTIVITY_EVENT_LABELS[kind],
      message: event.message ?? event.source,
      timestamp: event.timestamp,
      status: kind === "failed" ? "error" : "complete",
    });
  }

  return mapped.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
