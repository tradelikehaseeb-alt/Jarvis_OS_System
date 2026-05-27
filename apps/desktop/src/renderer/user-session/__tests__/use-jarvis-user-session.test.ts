import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { REAL_USER_SESSION_PROMPTS } from "@jarvis/types";

import { useJarvisUserSession } from "../use-jarvis-user-session";

describe("useJarvisUserSession", () => {
  it("starts session with provider health for all seven providers", async () => {
    const { result } = renderHook(() => useJarvisUserSession());

    await act(async () => {
      await result.current.startSession("conv-desktop-user-1");
    });

    expect(result.current.session?.state).toBe("active");
    expect(result.current.providerHealth.length).toBe(7);
  });

  it("runs full user session and captures telemetry", async () => {
    const { result } = renderHook(() => useJarvisUserSession());

    await act(async () => {
      await result.current.runSession();
    });

    expect(result.current.report?.promptResults).toHaveLength(
      REAL_USER_SESSION_PROMPTS.length,
    );
    expect(result.current.telemetry.length).toBe(REAL_USER_SESSION_PROMPTS.length);
  });
});
