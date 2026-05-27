import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useExecutionTimeline } from "../use-execution-timeline";

describe("useExecutionTimeline", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("maps activity stream to timeline steps", () => {
    const { result } = renderHook(() => useExecutionTimeline({ stepMs: 100 }));

    act(() => {
      result.current.startTimeline("plan");
      vi.advanceTimersByTime(500);
    });

    expect(result.current.steps.some((step) => step.kind === "planning_started")).toBe(
      true,
    );
    expect(result.current.progress).toBeGreaterThan(0);
  });

  it("ingests executionTimeline from task status output", () => {
    const { result } = renderHook(() => useExecutionTimeline());

    act(() => {
      result.current.ingestTaskStatus({
        taskId: "task-1",
        status: "completed",
        updatedAt: "2026-01-01T00:00:05.000Z",
        output: {
          executionTimeline: {
            timelineId: "stream-task-1",
            events: [
              {
                id: "tl-1",
                kind: "planning_started",
                label: "Planning started",
                timestamp: "2026-01-01T00:00:01.000Z",
                status: "complete",
              },
              {
                id: "tl-2",
                kind: "completed",
                label: "Completed",
                timestamp: "2026-01-01T00:00:05.000Z",
                status: "complete",
              },
            ],
          },
        },
      });
    });

    expect(result.current.steps.some((step) => step.kind === "completed")).toBe(true);
  });
});
