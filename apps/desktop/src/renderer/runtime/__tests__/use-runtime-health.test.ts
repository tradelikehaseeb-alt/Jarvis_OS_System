import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createMockJarvisApi } from "../../test/mock-jarvis-api";
import { useRuntimeHealth } from "../use-runtime-health";

const snapshot = {
  health: {
    status: "healthy" as const,
    processCount: 4,
    runningCount: 4,
    failedCount: 0,
    checkedAt: "2026-05-27T12:00:00.000Z",
  },
  processes: [
    {
      processId: "api-runtime",
      label: "Jarvis API Runtime",
      state: "running" as const,
      healthy: true,
      restartCount: 0,
    },
  ],
};

describe("useRuntimeHealth", () => {
  beforeEach(() => {
    window.jarvis = createMockJarvisApi({
      getRuntimeHealth: vi.fn().mockResolvedValue(snapshot),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads runtime health and clears loading state", async () => {
    const { result } = renderHook(() =>
      useRuntimeHealth({ pollMs: 60_000, enabled: true }),
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.health?.status).toBe("healthy");
    expect(result.current.statuses).toHaveLength(4);
    expect(result.current.events.some((event) => event.kind === "checked")).toBe(
      true,
    );
  });

  it("records bridge errors", async () => {
    vi.mocked(window.jarvis.getRuntimeHealth).mockRejectedValue(
      new Error("IPC unavailable"),
    );

    const { result } = renderHook(() =>
      useRuntimeHealth({ pollMs: 60_000, enabled: true }),
    );

    await waitFor(() => {
      expect(result.current.error).toBe("IPC unavailable");
    });

    expect(result.current.events.some((event) => event.kind === "error")).toBe(
      true,
    );
  });
});
