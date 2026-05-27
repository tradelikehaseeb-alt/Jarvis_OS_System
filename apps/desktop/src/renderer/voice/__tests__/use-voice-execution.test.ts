import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useActivityStream } from "../../activity";
import { submitChatAsTask } from "../../api/jarvis-client";
import { useVoiceExecution } from "../use-voice-execution";

vi.mock("../../api/jarvis-client", () => ({
  submitChatAsTask: vi.fn(),
}));

describe("useVoiceExecution", () => {
  it("processes voice input through API task pipeline", async () => {
    vi.mocked(submitChatAsTask).mockResolvedValue({
      create: {
        taskId: "task-voice-hook-1",
        status: "completed",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      classification: {
        intent: "plan",
        ruleId: "plan-keywords",
        reason: "planning",
        confidence: 0.9,
      },
      status: {
        taskId: "task-voice-hook-1",
        status: "completed",
        updatedAt: "2026-01-01T00:00:01.000Z",
        output: {
          activityStream: {
            events: [
              {
                type: "planning_started",
                timestamp: "2026-01-01T00:00:01.000Z",
              },
            ],
          },
        },
      },
    });

    const { result: activityResult } = renderHook(() => useActivityStream());
    const { result } = renderHook(() =>
      useVoiceExecution({
        activity: activityResult.current,
        skipHealthCheck: true,
      }),
    );

    await act(async () => {
      await result.current.processVoiceInput("Plan my week");
    });

    await waitFor(() => {
      expect(result.current.executing).toBe(false);
      expect(result.current.lastResult?.success).toBe(true);
      expect(result.current.lastResult?.taskId).toBe("task-voice-hook-1");
    });

    expect(submitChatAsTask).toHaveBeenCalled();
    expect(
      activityResult.current.events.some((e) => e.kind === "planning_started"),
    ).toBe(true);
  });

  it("stopVoiceExecution ends active execution state", () => {
    const { result: activityResult } = renderHook(() => useActivityStream());
    const { result } = renderHook(() =>
      useVoiceExecution({ activity: activityResult.current }),
    );

    const executionId = result.current.startVoiceExecution("Plan sprint");
    result.current.stopVoiceExecution(executionId);

    expect(result.current.executing).toBe(false);
  });
});
