import { useCallback, useEffect, useRef, useState } from "react";
import type { TaskStatusResponse } from "@jarvis/types";

import {
  ACTIVITY_EVENT_LABELS,
  type ActivityEvent,
  type ActivityEventKind,
} from "./activity-event";
import {
  DEFAULT_ACTIVITY_STEP_MS,
  progressionForIntent,
} from "./activity-progression";
import { mapTaskStatusToActivityEvents } from "./map-task-status-events";

export interface UseActivityStreamOptions {
  readonly stepMs?: number;
}

export interface UseActivityStreamResult {
  readonly events: readonly ActivityEvent[];
  readonly loading: boolean;
  readonly isStreaming: boolean;
  readonly startStream: (intentKind: string) => void;
  readonly ingestTaskStatus: (status: TaskStatusResponse) => void;
  readonly reportError: (message: string) => void;
  readonly reset: () => void;
}

let hookEventCounter = 0;

function nextHookEventId(kind: string): string {
  hookEventCounter += 1;
  return `activity-${kind}-${hookEventCounter}`;
}

function buildEvent(
  kind: ActivityEventKind,
  status: ActivityEvent["status"],
  message?: string,
): ActivityEvent {
  return {
    id: nextHookEventId(kind),
    kind,
    label: ACTIVITY_EVENT_LABELS[kind],
    message,
    timestamp: new Date().toISOString(),
    status,
  };
}

function mergeEvents(
  simulated: readonly ActivityEvent[],
  resolved: readonly ActivityEvent[],
): ActivityEvent[] {
  const byKind = new Map<string, ActivityEvent>();

  for (const event of simulated) {
    byKind.set(event.kind, event);
  }

  for (const event of resolved) {
    byKind.set(event.kind, {
      ...event,
      status: event.status === "error" ? "error" : "complete",
    });
  }

  return [...byKind.values()].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp),
  );
}

/**
 * Consumes orchestrator lifecycle/stream output for the activity timeline (Phase 48).
 */
export function useActivityStream(
  options: UseActivityStreamOptions = {},
): UseActivityStreamResult {
  const stepMs = options.stepMs ?? DEFAULT_ACTIVITY_STEP_MS;
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    for (const timer of timersRef.current) {
      clearTimeout(timer);
    }
    timersRef.current = [];
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    setEvents([]);
    setLoading(false);
    setIsStreaming(false);
  }, [clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const startStream = useCallback(
    (intentKind: string) => {
      clearTimers();
      setLoading(true);
      setIsStreaming(true);
      setEvents([]);

      const progression = progressionForIntent(intentKind);
      progression.forEach((kind, index) => {
        const timer = setTimeout(() => {
          setEvents((prev) => {
            const completed = prev.map((event) =>
              event.status === "active"
                ? { ...event, status: "complete" as const }
                : event,
            );
            return [
              ...completed,
              buildEvent(
                kind,
                index === progression.length - 1 ? "active" : "complete",
              ),
            ];
          });
        }, stepMs * (index + 1));
        timersRef.current.push(timer);
      });
    },
    [clearTimers, stepMs],
  );

  const ingestTaskStatus = useCallback(
    (status: TaskStatusResponse) => {
      clearTimers();
      const resolved = mapTaskStatusToActivityEvents(status);
      setEvents((prev) => mergeEvents(prev, resolved));
      setLoading(false);
      setIsStreaming(false);
    },
    [clearTimers],
  );

  const reportError = useCallback(
    (message: string) => {
      clearTimers();
      setEvents((prev) => [
        ...prev.map((event) =>
          event.status === "active"
            ? { ...event, status: "complete" as const }
            : event,
        ),
        buildEvent("failed", "error", message),
      ]);
      setLoading(false);
      setIsStreaming(false);
    },
    [clearTimers],
  );

  return {
    events,
    loading,
    isStreaming,
    startStream,
    ingestTaskStatus,
    reportError,
    reset,
  };
}
