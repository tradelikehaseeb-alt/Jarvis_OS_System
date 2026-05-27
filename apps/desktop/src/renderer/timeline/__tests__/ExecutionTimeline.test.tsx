import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExecutionTimeline } from "../ExecutionTimeline";

describe("ExecutionTimeline", () => {
  it("renders timeline steps", () => {
    render(
      <ExecutionTimeline
        steps={[
          {
            id: "1",
            kind: "planning_started",
            label: "Planning started",
            timestamp: "2026-05-27T12:00:00.000Z",
            status: "complete",
          },
          {
            id: "2",
            kind: "execution_started",
            label: "Execution started",
            timestamp: "2026-05-27T12:00:01.000Z",
            status: "active",
          },
        ]}
      />,
    );

    expect(screen.getByTestId("execution-timeline")).toBeInTheDocument();
    expect(screen.getByTestId("timeline-step-planning_started")).toBeInTheDocument();
    expect(screen.getByTestId("timeline-step-execution_started")).toBeInTheDocument();
  });

  it("shows empty state", () => {
    render(<ExecutionTimeline steps={[]} />);
    expect(screen.getByTestId("execution-timeline-empty")).toBeInTheDocument();
  });
});
