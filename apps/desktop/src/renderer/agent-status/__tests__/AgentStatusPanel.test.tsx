import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AgentStatusPanel } from "../AgentStatusPanel";
import type { AgentStatus } from "../agent-status";

const idleStatus: AgentStatus = {
  hermes: "idle",
  openClaw: "idle",
  memoryUpdating: false,
  displayMessage: "Jarvis is ready",
  isActive: false,
};

const planningStatus: AgentStatus = {
  hermes: "planning",
  openClaw: "idle",
  memoryUpdating: false,
  displayMessage: "Hermes planning…",
  isActive: true,
};

describe("AgentStatusPanel", () => {
  it("shows idle message when agents are inactive", () => {
    render(<AgentStatusPanel status={idleStatus} />);

    expect(screen.getByTestId("agent-status-panel")).toBeInTheDocument();
    expect(screen.getByTestId("agent-status-idle")).toBeInTheDocument();
    expect(screen.getByTestId("agent-status-badge-hermes")).toHaveAttribute(
      "data-state",
      "idle",
    );
  });

  it("shows thinking state with badges while loading", () => {
    render(
      <AgentStatusPanel
        status={planningStatus}
        loading
        events={[
          {
            id: "e1",
            kind: "hermes_planning",
            agent: "hermes",
            message: "Hermes planning…",
            timestamp: "2026-01-01T00:00:01.000Z",
          },
        ]}
      />,
    );

    expect(screen.getByTestId("agent-status-thinking")).toHaveTextContent(
      "Hermes planning…",
    );
    expect(screen.getByTestId("agent-status-badge-hermes")).toHaveAttribute(
      "data-state",
      "planning",
    );
    expect(screen.getByTestId("agent-status-events")).toBeInTheDocument();
  });

  it("shows error alert when status includes error", () => {
    render(
      <AgentStatusPanel
        status={{
          ...planningStatus,
          hermes: "failed",
          openClaw: "failed",
          error: "Gateway offline",
          displayMessage: "Gateway offline",
        }}
      />,
    );

    expect(screen.getByTestId("agent-status-error")).toHaveTextContent(
      "Gateway offline",
    );
  });

  it("shows memory updating indicator", () => {
    render(
      <AgentStatusPanel
        status={{
          ...idleStatus,
          memoryUpdating: true,
          displayMessage: "Memory updating…",
          isActive: true,
        }}
        loading
      />,
    );

    expect(screen.getByTestId("agent-status-memory")).toHaveTextContent(
      "Memory updating…",
    );
  });
});
