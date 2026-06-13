import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AIStatusOrb } from "../AIStatusOrb";
import { DynamicActivityPanel } from "../DynamicActivityPanel";

describe("AIStatusOrb", () => {
  it("renders provider latency when supplied", () => {
    render(
      <AIStatusOrb
        state="streaming"
        label="Generating response…"
        providerLabel="groq"
        latencyMs={842}
      />,
    );

    expect(screen.getByTestId("ai-status-provider")).toHaveTextContent("groq");
    expect(screen.getByTestId("ai-status-micro-dashboard")).toHaveTextContent("842 ms");
  });
});

describe("DynamicActivityPanel", () => {
  it("shows only active events", () => {
    render(
      <DynamicActivityPanel
        loading={false}
        events={[
          {
            id: "1",
            kind: "planning_started",
            label: "Understanding request",
            timestamp: "2026-01-01T00:00:00.000Z",
            status: "active",
          },
          {
            id: "2",
            kind: "planning_completed",
            label: "Request understood",
            timestamp: "2026-01-01T00:00:01.000Z",
            status: "complete",
          },
        ]}
      />,
    );

    expect(screen.getByTestId("dynamic-activity-panel")).toBeInTheDocument();
    expect(screen.getByTestId("dynamic-activity-planning_started")).toBeInTheDocument();
    expect(
      screen.queryByTestId("dynamic-activity-planning_completed"),
    ).not.toBeInTheDocument();
  });
});
