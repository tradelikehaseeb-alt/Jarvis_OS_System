import { useCallback, useEffect, useRef, useState } from "react";

import { deriveRuntimeStatuses } from "./derive-runtime-status";
import { fetchRuntimeHealth } from "./runtime-client";
import type { RuntimeHealthEvent } from "./runtime-health-event";
import type { RuntimeHealthSnapshot } from "./runtime-health-snapshot";
import type { RuntimeStatus } from "./runtime-status";

export const DEFAULT_RUNTIME_HEALTH_POLL_MS = 5_000;

export interface UseRuntimeHealthOptions {
  readonly pollMs?: number;
  readonly enabled?: boolean;
}

export interface UseRuntimeHealthResult {
  readonly statuses: readonly RuntimeStatus[];
  readonly health: RuntimeHealthSnapshot["health"] | null;
  readonly events: readonly RuntimeHealthEvent[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly refresh: () => Promise<void>;
}

let eventCounter = 0;

function nextEventId(): string {
  eventCounter += 1;
  return `runtime-health-${eventCounter}`;
}

function buildStateChangeEvents(
  previous: readonly RuntimeStatus[],
  next: readonly RuntimeStatus[],
  timestamp: string,
): RuntimeHealthEvent[] {
  const events: RuntimeHealthEvent[] = [];

  for (const status of next) {
    const prior = previous.find((entry) => entry.processId === status.processId);
    if (!prior || prior.state === status.state) {
      continue;
    }

    events.push({
      id: nextEventId(),
      kind: "state_change",
      processId: status.processId,
      message: `${status.displayName} ${prior.state} → ${status.state}`,
      timestamp,
    });
  }

  return events;
}

/**
 * Polls main-process runtime health via IPC (Phase 56).
 */
export function useRuntimeHealth(
  options: UseRuntimeHealthOptions = {},
): UseRuntimeHealthResult {
  const pollMs = options.pollMs ?? DEFAULT_RUNTIME_HEALTH_POLL_MS;
  const enabled = options.enabled ?? true;
  const [statuses, setStatuses] = useState<readonly RuntimeStatus[]>([]);
  const [health, setHealth] = useState<RuntimeHealthSnapshot["health"] | null>(null);
  const [events, setEvents] = useState<RuntimeHealthEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousStatusesRef = useRef<readonly RuntimeStatus[]>([]);

  const refresh = useCallback(async () => {
    try {
      const snapshot = await fetchRuntimeHealth();
      const nextStatuses = deriveRuntimeStatuses(snapshot);
      const timestamp = snapshot.health.checkedAt;

      setHealth(snapshot.health);
      setStatuses(nextStatuses);
      setError(null);

      const stateEvents = buildStateChangeEvents(
        previousStatusesRef.current,
        nextStatuses,
        timestamp,
      );

      setEvents((prev) => [
        ...prev,
        ...stateEvents,
        {
          id: nextEventId(),
          kind: "checked",
          message: `Health check: ${snapshot.health.runningCount}/${snapshot.health.processCount} running`,
          timestamp,
          aggregateStatus: snapshot.health.status,
        },
      ]);

      previousStatusesRef.current = nextStatuses;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Runtime health unavailable";
      setError(message);
      setEvents((prev) => [
        ...prev,
        {
          id: nextEventId(),
          kind: "error",
          message,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, pollMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [enabled, pollMs, refresh]);

  return {
    statuses,
    health,
    events,
    loading,
    error,
    refresh,
  };
}
