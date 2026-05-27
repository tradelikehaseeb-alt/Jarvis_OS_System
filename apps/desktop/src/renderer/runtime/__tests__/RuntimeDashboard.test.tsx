import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RuntimeDashboard } from "../RuntimeDashboard";
import { deriveRuntimeStatuses } from "../derive-runtime-status";
import type { RuntimeHealthSnapshot } from "../runtime-health-snapshot";

const snapshot: RuntimeHealthSnapshot = {
  health: {
    status: "healthy",
    processCount: 4,
    runningCount: 4,
    failedCount: 0,
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
      restartCount: 0,
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
      state: "running",
      healthy: true,
      restartCount: 0,
    },
  ],
};

describe("RuntimeDashboard", () => {
  it("shows loading state", () => {
    render(
      <RuntimeDashboard
        statuses={[]}
        health={null}
        loading
      />,
    );

    expect(screen.getByTestId("runtime-dashboard-loading")).toBeInTheDocument();
  });

  it("renders aggregate health and process cards", () => {
    render(
      <RuntimeDashboard
        statuses={deriveRuntimeStatuses(snapshot)}
        health={snapshot.health}
        events={[
          {
            id: "e1",
            kind: "checked",
            message: "Health check: 4/4 running",
            timestamp: snapshot.health.checkedAt,
            aggregateStatus: "healthy",
          },
        ]}
      />,
    );

    expect(screen.getByTestId("runtime-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("runtime-dashboard-aggregate")).toHaveAttribute(
      "data-status",
      "healthy",
    );
    expect(screen.getByTestId("runtime-health-card-api-runtime")).toBeInTheDocument();
    expect(screen.getByTestId("runtime-health-card-hermes-runtime")).toBeInTheDocument();
    expect(screen.getByTestId("runtime-dashboard-events")).toHaveTextContent(
      "Health check: 4/4 running",
    );
  });

  it("calls refresh handler", () => {
    const onRefresh = vi.fn();

    render(
      <RuntimeDashboard
        statuses={deriveRuntimeStatuses(snapshot)}
        health={snapshot.health}
        onRefresh={onRefresh}
      />,
    );

    fireEvent.click(screen.getByTestId("runtime-dashboard-refresh"));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
