import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PipelineTelemetryPanel } from "../PipelineTelemetryPanel";
import { buildPipelineTelemetryView } from "../command-center-telemetry";

describe("PipelineTelemetryPanel", () => {
  it("renders active node and toolset badges", () => {
    render(
      <PipelineTelemetryPanel
        activeNode="Hermes (The Brain)"
        routingPath="skills · automate"
        openClawCluster="Connected"
        toolsets={["safe", "windows_automation", "research"]}
        loading
      />,
    );

    expect(screen.getByTestId("telemetry-active-node")).toHaveTextContent(
      "Hermes (The Brain)",
    );
    expect(screen.getByTestId("telemetry-routing-path")).toHaveTextContent(
      "skills · automate",
    );
    expect(screen.getByTestId("telemetry-toolset-safe")).toBeInTheDocument();
    expect(screen.getByTestId("telemetry-toolset-windows_automation")).toBeInTheDocument();
  });
});

describe("buildPipelineTelemetryView", () => {
  it("maps automate queries to windows_automation toolsets", () => {
    const view = buildPipelineTelemetryView({
      lastUserQuery: "close window chrome",
      loading: true,
      isStreaming: false,
      agentStatus: {
        hermes: "planning",
        openClaw: "idle",
        memoryUpdating: false,
        displayMessage: "Jarvis is automating your desktop...",
        isActive: true,
        error: undefined,
      },
    });

    expect(view.routingPath).toContain("skills");
    expect(view.toolsets).toContain("windows_automation");
  });
});
