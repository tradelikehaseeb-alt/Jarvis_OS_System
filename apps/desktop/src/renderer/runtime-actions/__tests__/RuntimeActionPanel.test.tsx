import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RuntimeActionPanel } from "../RuntimeActionPanel";
import type { RuntimeStatus } from "../../runtime/runtime-status";

const statuses: RuntimeStatus[] = [
  {
    processId: "api-runtime",
    label: "Jarvis API Runtime",
    displayName: "API Runtime",
    state: "running",
    healthy: true,
    restartCount: 0,
  },
  {
    processId: "orchestrator",
    label: "Jarvis Orchestrator",
    displayName: "Orchestrator",
    state: "stopped",
    healthy: false,
    restartCount: 1,
  },
];

describe("RuntimeActionPanel", () => {
  it("renders process controls and refresh health action", () => {
    render(
      <RuntimeActionPanel
        statuses={statuses}
        actions={{
          loading: false,
          activeAction: null,
          activeProcessId: null,
          error: null,
          startProcess: vi.fn(),
          stopProcess: vi.fn(),
          restartProcess: vi.fn(),
          refreshHealth: vi.fn(),
        }}
      />,
    );

    expect(screen.getByTestId("runtime-action-panel")).toBeInTheDocument();
    expect(screen.getByTestId("runtime-action-row-api-runtime")).toBeInTheDocument();
    expect(screen.getByTestId("runtime-action-start-orchestrator")).not.toBeDisabled();
    expect(screen.getByTestId("runtime-action-start-api-runtime")).toBeDisabled();
    expect(screen.getByTestId("runtime-action-stop-orchestrator")).toBeDisabled();
  });

  it("invokes runtime actions from buttons", () => {
    const restartProcess = vi.fn();
    const refreshHealth = vi.fn();

    render(
      <RuntimeActionPanel
        statuses={statuses}
        actions={{
          loading: false,
          activeAction: null,
          activeProcessId: null,
          error: null,
          startProcess: vi.fn(),
          stopProcess: vi.fn(),
          restartProcess,
          refreshHealth,
        }}
      />,
    );

    fireEvent.click(screen.getByTestId("runtime-action-restart-api-runtime"));
    fireEvent.click(screen.getByTestId("runtime-action-refresh-health"));

    expect(restartProcess).toHaveBeenCalledWith("api-runtime");
    expect(refreshHealth).toHaveBeenCalledTimes(1);
  });

  it("shows action error alert", () => {
    render(
      <RuntimeActionPanel
        statuses={statuses}
        actions={{
          loading: false,
          activeAction: null,
          activeProcessId: null,
          error: "start failed",
          startProcess: vi.fn(),
          stopProcess: vi.fn(),
          restartProcess: vi.fn(),
          refreshHealth: vi.fn(),
        }}
      />,
    );

    expect(screen.getByTestId("runtime-action-error")).toHaveTextContent("start failed");
  });
});
