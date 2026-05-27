import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TaskProgressPanel } from "../TaskProgressPanel";

describe("TaskProgressPanel", () => {
  it("renders progress bar and timeline", () => {
    render(
      <TaskProgressPanel
        progress={60}
        steps={[
          {
            id: "1",
            kind: "planning_completed",
            label: "Planning completed",
            timestamp: "2026-05-27T12:00:00.000Z",
            status: "complete",
          },
        ]}
      />,
    );

    expect(screen.getByTestId("task-progress-panel")).toBeInTheDocument();
    expect(screen.getByTestId("task-progress-percent")).toHaveTextContent("60%");
    expect(screen.getByTestId("task-progress-bar")).toHaveAttribute("aria-valuenow", "60");
  });
});
