import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { HermesPlanMessage } from "../HermesPlanMessage";

const sampleData = {
  plan: {
    goal: "Plan my week",
    steps: ["Clarify priorities", "Schedule tasks", "Review plan"],
    agentId: "hermes",
  },
  details: {
    taskStatus: "completed",
    intentKind: "plan",
    adapterId: "hermes-planning-adapter",
    stub: false,
    reasoningSummary: "Structured plan produced",
  },
};

describe("HermesPlanMessage", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders goal, steps, and Hermes badge", () => {
    render(<HermesPlanMessage data={sampleData} />);

    expect(screen.getByTestId("hermes-agent-badge")).toHaveTextContent("Hermes");
    expect(screen.getByTestId("hermes-plan-goal")).toHaveTextContent("Plan my week");
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("expands planning details on click", () => {
    const { getByText } = render(<HermesPlanMessage data={sampleData} />);

    fireEvent.click(getByText("Planning Details"));

    expect(screen.getByText("hermes-planning-adapter")).toBeInTheDocument();
    expect(screen.getByText(/Structured plan produced/)).toBeInTheDocument();
  });
});
