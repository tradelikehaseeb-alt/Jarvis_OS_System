import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { REAL_PROVIDER_VALIDATION_COMMANDS } from "@jarvis/types";

import { useLiveProvider } from "../use-live-provider";

describe("useLiveProvider", () => {
  it("loads provider health snapshots", async () => {
    const { result } = renderHook(() => useLiveProvider());

    await act(async () => {
      await result.current.refreshHealth();
    });

    expect(result.current.health.length).toBe(7);
  });

  it("executes a real provider validation prompt", async () => {
    const { result } = renderHook(() => useLiveProvider());

    await act(async () => {
      await result.current.executePrompt(REAL_PROVIDER_VALIDATION_COMMANDS[0]!);
    });

    expect(result.current.lastResult?.success).toBe(true);
    expect(result.current.telemetry?.sessionId).toBeTruthy();
  });
});
