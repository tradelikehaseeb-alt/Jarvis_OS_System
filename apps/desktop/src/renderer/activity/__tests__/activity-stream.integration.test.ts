import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useActivityStream } from "../use-activity-stream";

describe("useActivityStream live stream", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("notifies subscribers when task status includes activityStream events", () => {
    const { result } = renderHook(() => useActivityStream());
    const received: string[] = [];

    act(() => {
      result.current.subscribe({
        subscriberId: "panel-1",
        onEvent: (event) => received.push(event.kind),
      });
      result.current.startStream("plan");
      result.current.ingestTaskStatus({
        taskId: "task-live-1",
        status: "completed",
        updatedAt: "2026-01-01T00:00:05.000Z",
        output: {
          activityStream: {
            streamSessionId: "stream-task-live-1",
            events: [
              {
                eventId: "evt-1",
                type: "planning_started",
                timestamp: "2026-01-01T00:00:01.000Z",
                message: "Planning",
                source: "hermes",
              },
              {
                eventId: "evt-2",
                type: "execution_completed",
                timestamp: "2026-01-01T00:00:04.000Z",
                message: "Done",
                source: "openclaw",
              },
            ],
          },
        },
      });
    });

    expect(received).toContain("planning_started");
    expect(received).toContain("execution_completed");
    expect(result.current.events.some((e) => e.kind === "planning_started")).toBe(
      true,
    );
    expect(result.current.isStreaming).toBe(false);
  });

  it("stopStream ends staged streaming", () => {
    const { result } = renderHook(() => useActivityStream({ stepMs: 100 }));

    act(() => {
      result.current.startStream("plan");
      result.current.stopStream();
    });

    expect(result.current.isStreaming).toBe(false);
  });

  it("unsubscribe stops live notifications", () => {
    const { result } = renderHook(() => useActivityStream());
    const received: string[] = [];

    act(() => {
      result.current.subscribe({
        subscriberId: "panel-2",
        onEvent: (event) => received.push(event.kind),
      });
      result.current.unsubscribe("panel-2");
      result.current.reportError("Offline");
    });

    expect(received).toHaveLength(0);
  });
});
