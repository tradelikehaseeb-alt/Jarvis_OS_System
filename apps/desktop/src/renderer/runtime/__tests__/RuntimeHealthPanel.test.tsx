import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RuntimeHealthPanel } from "../RuntimeHealthPanel";

describe("RuntimeHealthPanel", () => {
  it("renders Hermes, OpenClaw, Speech, and Memory health", () => {
    render(
      <RuntimeHealthPanel
        health={{
          status: "healthy",
          components: [
            { componentId: "hermes", label: "Hermes", healthy: true, state: "running" },
            { componentId: "openclaw", label: "OpenClaw", healthy: true, state: "running" },
            { componentId: "speech", label: "Speech", healthy: true, state: "running" },
            { componentId: "memory", label: "Memory", healthy: true, state: "running" },
            { componentId: "api", label: "API Runtime", healthy: true, state: "running" },
            {
              componentId: "orchestrator",
              label: "Orchestrator",
              healthy: true,
              state: "running",
            },
          ],
          startupPhase: "ready",
          recoveryState: "none",
          checkedAt: "2026-05-27T12:00:00.000Z",
          healthyCount: 6,
          totalCount: 6,
        }}
      />,
    );

    expect(screen.getByTestId("runtime-health-panel-hermes")).toBeInTheDocument();
    expect(screen.getByTestId("runtime-health-panel-openclaw")).toBeInTheDocument();
    expect(screen.getByTestId("runtime-health-panel-speech")).toBeInTheDocument();
    expect(screen.getByTestId("runtime-health-panel-memory")).toBeInTheDocument();
    expect(screen.getByTestId("runtime-health-panel-recovery")).toHaveAttribute(
      "data-recovery",
      "none",
    );
  });
});
