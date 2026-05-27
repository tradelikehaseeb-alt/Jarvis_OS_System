import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TimelineStep } from "../TimelineStep";
import type { TimelineStep as TimelineStepType } from "../timeline-step";

const step: TimelineStepType = {
  id: "step-1",
  kind: "planning_started",
  label: "Planning started",
  message: "Hermes planning",
  timestamp: "2026-05-27T12:00:00.000Z",
  status: "complete",
};

describe("TimelineStep", () => {
  it("renders step label and message", () => {
    render(<TimelineStep step={step} />);

    expect(screen.getByTestId("timeline-step-planning_started")).toBeInTheDocument();
    expect(screen.getByText("Planning started")).toBeInTheDocument();
    expect(screen.getByText("Hermes planning")).toBeInTheDocument();
  });
});
