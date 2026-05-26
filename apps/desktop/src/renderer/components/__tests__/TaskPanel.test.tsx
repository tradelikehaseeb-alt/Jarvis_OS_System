import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TaskPanel } from "../TaskPanel";

describe("TaskPanel", () => {
  it("shows loading state", () => {
    render(<TaskPanel loading />);
    expect(screen.getByText(/Running task/)).toBeInTheDocument();
  });

  it("shows task id and skill output", () => {
    render(
      <TaskPanel
        create={{
          taskId: "task-abc",
          status: "completed",
          createdAt: "2026-01-01T00:00:00.000Z",
        }}
        status={{
          taskId: "task-abc",
          status: "completed",
          progressPercent: 100,
          output: {
            skill: { skillId: "search-skill", data: { total: 2 } },
            routing: { selectedAgentId: "hermes" },
          },
          updatedAt: "2026-01-01T00:00:00.000Z",
        }}
      />,
    );
    expect(screen.getByText("task-abc")).toBeInTheDocument();
    expect(screen.getByText(/search-skill/)).toBeInTheDocument();
    expect(screen.getByText("hermes")).toBeInTheDocument();
  });
});
