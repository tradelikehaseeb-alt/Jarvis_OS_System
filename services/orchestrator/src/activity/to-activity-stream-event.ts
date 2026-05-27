import type { StreamEvent } from "../streaming/stream-event";

import type { ActivityStreamEvent, ActivityStreamSource } from "./activity-stream-event";

function resolveSource(
  payload?: Readonly<Record<string, unknown>>,
): ActivityStreamSource | undefined {
  const source = payload?.source;
  if (source === "hermes" || source === "openclaw" || source === "orchestrator") {
    return source;
  }
  return undefined;
}

/**
 * Maps a {@link StreamEvent} to {@link ActivityStreamEvent} (Phase 71).
 */
export function toActivityStreamEvent(event: StreamEvent): ActivityStreamEvent {
  return {
    eventId: event.eventId,
    type: event.type,
    timestamp: event.timestamp,
    streamSessionId: event.streamSessionId,
    sessionId: event.sessionId,
    taskId: event.taskId,
    userId: event.userId,
    conversationId: event.conversationId,
    message: event.message,
    source: resolveSource(event.payload),
    payload: event.payload,
  };
}
