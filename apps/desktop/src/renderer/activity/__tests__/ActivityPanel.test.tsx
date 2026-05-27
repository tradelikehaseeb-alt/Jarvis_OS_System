import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ActivityPanel } from "../ActivityPanel";
import type { ActivityEvent } from "../activity-event";

const events: ActivityEvent[] = [
  {
    id: "1",
    kind: "planning_started",
    label: "Planning started",
    timestamp: "2026-01-01T00:00:01.000Z",
    status: "complete",
  },
  {
    id: "2",
    kind: "execution_completed",
    label: "Execution completed",
    message: "Task completed",
    timestamp: "2026-01-01T00:00:05.000Z",
    status: "complete",
  },
];

describe("ActivityPanel", () => {
  it("renders timeline events", () => {
    render(<ActivityPanel events={events} />);

    expect(screen.getByTestId("activity-panel")).toBeInTheDocument();
    expect(screen.getByTestId("activity-timeline")).toBeInTheDocument();
    expect(screen.getByTestId("activity-item-planning_started")).toBeInTheDocument();
    expect(screen.getByTestId("activity-item-execution_completed")).toHaveTextContent(
      "Task completed",
    );
  });

  it("shows loading state", () => {
    render(<ActivityPanel events={[]} loading />);

    expect(screen.getByTestId("activity-timeline-loading")).toBeInTheDocument();
  });

  it("shows empty state when idle", () => {
    render(<ActivityPanel events={[]} />);

    expect(screen.getByTestId("activity-timeline-empty")).toBeInTheDocument();
  });
});
