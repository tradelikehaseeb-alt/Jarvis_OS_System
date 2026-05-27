import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { JarvisDesktopApi } from "../../global";
import { useRuntimeActions } from "../use-runtime-actions";

const successResponse = {
  ok: true,
  action: "start" as const,
  processId: "api-runtime",
  message: "start completed",
};

describe("useRuntimeActions", () => {
  beforeEach(() => {
    window.jarvis = {
      getApiUrl: vi.fn(),
      checkApiHealth: vi.fn(),
      getRuntimeHealth: vi.fn(),
      executeRuntimeAction: vi.fn().mockResolvedValue(successResponse),
      createTask: vi.fn(),
      getTaskStatus: vi.fn(),
    } satisfies JarvisDesktopApi;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("runs start action and clears loading state", async () => {
    const onActionComplete = vi.fn();
    const { result } = renderHook(() =>
      useRuntimeActions({ onActionComplete }),
    );

    await result.current.startProcess("api-runtime");

    expect(window.jarvis.executeRuntimeAction).toHaveBeenCalledWith({
      action: "start",
      processId: "api-runtime",
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.lastResponse?.ok).toBe(true);
    });

    expect(onActionComplete).toHaveBeenCalledWith(successResponse);
  });

  it("records action errors", async () => {
    vi.mocked(window.jarvis.executeRuntimeAction).mockResolvedValue({
      ok: false,
      action: "stop",
      processId: "orchestrator",
      error: "Runtime process not registered: orchestrator",
    });

    const { result } = renderHook(() => useRuntimeActions());

    await result.current.stopProcess("orchestrator");

    await waitFor(() => {
      expect(result.current.error).toBe(
        "Runtime process not registered: orchestrator",
      );
    });
  });

  it("supports refresh-health without processId", async () => {
    vi.mocked(window.jarvis.executeRuntimeAction).mockResolvedValue({
      ok: true,
      action: "refresh-health",
      message: "Runtime health refreshed",
    });

    const { result } = renderHook(() => useRuntimeActions());

    await result.current.refreshHealth();

    expect(window.jarvis.executeRuntimeAction).toHaveBeenCalledWith({
      action: "refresh-health",
    });
  });
});
