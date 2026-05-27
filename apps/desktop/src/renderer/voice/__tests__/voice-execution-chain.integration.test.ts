import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useActivityStream } from "../../activity";
import { submitChatAsTask } from "../../api/jarvis-client";
import { useVoiceExecution } from "../use-voice-execution";

vi.mock("../../api/jarvis-client", () => ({
  submitChatAsTask: vi.fn(),
}));

describe("voice execution chain integration", () => {
  it("flows voice input through speech runtime to activity stream", async () => {
    vi.mocked(submitChatAsTask).mockResolvedValue({
      create: {
        taskId: "task-voice-chain-1",
        status: "completed",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      classification: {
        intent: "automate",
        ruleId: "automate-keywords",
        reason: "automation",
        confidence: 0.9,
      },
      status: {
        taskId: "task-voice-chain-1",
        status: "completed",
        updatedAt: "2026-01-01T00:00:02.000Z",
        output: {
          activityStream: {
            events: [
              {
                type: "planning_started",
                timestamp: "2026-01-01T00:00:01.000Z",
                message: "Planning",
              },
              {
                type: "execution_started",
                timestamp: "2026-01-01T00:00:02.000Z",
                message: "Executing",
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
      await result.current.processVoiceInput("Automate opening the dashboard");
    });

    await waitFor(() => {
      expect(result.current.lastResult?.classification?.intent).toBe("automate");
      expect(
        activityResult.current.events.some((e) => e.kind === "execution_started"),
      ).toBe(true);
    });
  });
});
