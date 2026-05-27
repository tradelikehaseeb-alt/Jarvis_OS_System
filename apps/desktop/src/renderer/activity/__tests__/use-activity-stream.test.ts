import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useActivityStream } from "../use-activity-stream";

describe("useActivityStream", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stages planning events while streaming", () => {
    const { result } = renderHook(() =>
      useActivityStream({ stepMs: 100 }),
    );

    act(() => {
      result.current.startStream("plan");
    });

    expect(result.current.isStreaming).toBe(true);
    expect(result.current.events).toHaveLength(0);

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.events.some((e) => e.kind === "execution_started")).toBe(
      true,
    );

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(result.current.events.some((e) => e.kind === "planning_completed")).toBe(
      true,
    );
  });

  it("merges task status events when ingest completes", () => {
    const { result } = renderHook(() => useActivityStream({ stepMs: 50 }));

    act(() => {
      result.current.startStream("plan");
      vi.advanceTimersByTime(300);
      result.current.ingestTaskStatus({
        taskId: "task-1",
        status: "completed",
        updatedAt: "2026-01-01T00:00:05.000Z",
        output: {
          memory: {
            summary: "Summary",
            conversationId: "conv-1",
            historyCount: 2,
          },
          executionLifecycle: {
            sessionId: "exec-session-task-1",
            state: "completed",
            activityCount: 1,
            events: [],
            activities: [
              {
                kind: "planning_completed",
                summary: "Done planning",
                timestamp: "2026-01-01T00:00:04.000Z",
              },
            ],
          },
        },
      });
    });

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.events.some((e) => e.kind === "memory_saved")).toBe(
      true,
    );
  });

  it("reports stream errors", () => {
    const { result } = renderHook(() => useActivityStream());

    act(() => {
      result.current.reportError("Gateway offline");
    });

    expect(result.current.events.some((e) => e.kind === "failed")).toBe(true);
    expect(result.current.isStreaming).toBe(false);
  });
});
