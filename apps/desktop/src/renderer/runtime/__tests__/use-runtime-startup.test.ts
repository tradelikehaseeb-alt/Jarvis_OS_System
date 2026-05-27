import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createMockJarvisApi } from "../../test/mock-jarvis-api";
import { useRuntimeStartup } from "../use-runtime-startup";

describe("useRuntimeStartup", () => {
  beforeEach(() => {
    window.jarvis = createMockJarvisApi();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("syncs startup status on mount by default", async () => {
    const { result } = renderHook(() => useRuntimeStartup());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(window.jarvis.getStartupStatus).toHaveBeenCalled();
    expect(result.current.ready).toBe(true);
    expect(result.current.status?.phase).toBe("ready");
    expect(result.current.apiBaseUrl).toBe("http://127.0.0.1:8787");
  });

  it("initializeRuntime delegates to IPC bridge", async () => {
    const { result } = renderHook(() =>
      useRuntimeStartup({ autoSync: false }),
    );

    await result.current.initializeRuntime();

    expect(window.jarvis.initializeRuntime).toHaveBeenCalled();
    await waitFor(() => {
      expect(result.current.ready).toBe(true);
    });
  });

  it("recoverRuntime records degraded recovery flow", async () => {
    vi.mocked(window.jarvis.getStartupStatus).mockResolvedValue({
      state: {
        phase: "degraded",
        ready: false,
        initialized: true,
        validated: true,
        recovered: false,
        processCount: 2,
        healthyProcessCount: 1,
        failedProcesses: ["speech-runtime"],
        message: "Degraded runtime",
        updatedAt: "2026-05-27T12:00:00.000Z",
      },
      events: [],
    });

    vi.mocked(window.jarvis.recoverRuntime).mockResolvedValue({
      state: {
        phase: "ready",
        ready: true,
        initialized: true,
        validated: true,
        recovered: true,
        processCount: 2,
        healthyProcessCount: 2,
        failedProcesses: [],
        message: "Runtime ready",
        updatedAt: "2026-05-27T12:01:00.000Z",
      },
      events: [
        {
          id: "recovery-1",
          kind: "recovery_completed",
          message: "Recovered 1 process(es)",
          timestamp: "2026-05-27T12:01:00.000Z",
        },
      ],
    });

    const { result } = renderHook(() =>
      useRuntimeStartup({ autoSync: true }),
    );

    await waitFor(() => {
      expect(result.current.status?.phase).toBe("degraded");
    });

    await result.current.recoverRuntime();

    expect(window.jarvis.recoverRuntime).toHaveBeenCalled();
    await waitFor(() => {
      expect(result.current.ready).toBe(true);
    });
    expect(result.current.events.some((event) => event.kind === "recovery_completed")).toBe(
      true,
    );
  });
});
