import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { LIVE_EXECUTION_VALIDATION_COMMANDS } from "@jarvis/types";

import { __resetLiveExecutionRuntimeForTest } from "../live-execution-client";
import { useLiveExecution } from "../use-live-execution";

describe("useLiveExecution", () => {
  beforeEach(() => {
    __resetLiveExecutionRuntimeForTest();
  });

  it("starts session and executes validation command", async () => {
    const { result } = renderHook(() => useLiveExecution());

    await act(async () => {
      await result.current.startSession("conv-desktop-live");
    });

    expect(result.current.session?.sessionId).toContain("live-exec-");

    await act(async () => {
      const liveResult = await result.current.executeCommand(
        LIVE_EXECUTION_VALIDATION_COMMANDS[0],
      );
      expect(liveResult.success).toBe(true);
      expect(liveResult.workspaceResponse).toBeTruthy();
    });

    await waitFor(() => {
      expect(result.current.updates.some((u) => u.kind === "completed")).toBe(true);
    });

    expect(result.current.telemetry?.command).toBe(
      LIVE_EXECUTION_VALIDATION_COMMANDS[0],
    );
  });
});
