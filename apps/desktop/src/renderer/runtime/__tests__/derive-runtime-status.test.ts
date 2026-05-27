import { describe, expect, it } from "vitest";

import {
  aggregateStatusLabel,
  deriveRuntimeStatuses,
  RUNTIME_PROCESS_ORDER,
} from "../derive-runtime-status";
import type { RuntimeHealthSnapshot } from "../runtime-health-snapshot";

const snapshot: RuntimeHealthSnapshot = {
  health: {
    status: "degraded",
    processCount: 4,
    runningCount: 3,
    failedCount: 1,
    checkedAt: "2026-05-27T12:00:00.000Z",
  },
  processes: [
    {
      processId: "api-runtime",
      label: "Jarvis API Runtime",
      state: "running",
      healthy: true,
      restartCount: 0,
    },
    {
      processId: "orchestrator",
      label: "Jarvis Orchestrator",
      state: "running",
      healthy: true,
      restartCount: 1,
    },
    {
      processId: "hermes-runtime",
      label: "Hermes Runtime",
      state: "running",
      healthy: true,
      restartCount: 0,
    },
    {
      processId: "openclaw-runtime",
      label: "OpenClaw Runtime",
      state: "failed",
      healthy: false,
      restartCount: 2,
      lastError: "stub failure",
    },
  ],
};

describe("deriveRuntimeStatuses", () => {
  it("orders processes for dashboard display", () => {
    const statuses = deriveRuntimeStatuses(snapshot);

    expect(statuses.map((status) => status.processId)).toEqual([
      ...RUNTIME_PROCESS_ORDER,
    ]);
  });

  it("maps display names and error details", () => {
    const statuses = deriveRuntimeStatuses(snapshot);
    const openclaw = statuses.find((status) => status.processId === "openclaw-runtime");

    expect(openclaw?.displayName).toBe("OpenClaw Runtime");
    expect(openclaw?.lastError).toBe("stub failure");
    expect(openclaw?.restartCount).toBe(2);
  });

  it("labels aggregate health status", () => {
    expect(aggregateStatusLabel("healthy")).toBe("Healthy");
    expect(aggregateStatusLabel("degraded")).toBe("Degraded");
    expect(aggregateStatusLabel("unavailable")).toBe("Unavailable");
  });
});
