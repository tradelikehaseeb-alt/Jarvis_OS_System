import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderHook } from "@testing-library/react";

import { mapProductivityFromTaskOutput } from "../map-productivity-from-task-output";
import { useProductivitySession } from "../use-productivity-session";
import { ProductivityDashboard } from "../ProductivityDashboard";

describe("mapProductivityFromTaskOutput", () => {
  it("maps orchestrator productivity output to user-facing labels", () => {
    const view = mapProductivityFromTaskOutput({
      productivity: {
        sessionId: "prod-1",
        success: true,
        summary: "Communication workflow complete.",
        taskCount: 2,
        activities: [
          {
            kind: "communication",
            userLabel: "Reviewing emails…",
            message: "Unread emails summarized",
            completed: true,
            timestamp: "2026-05-27T00:00:00.000Z",
          },
        ],
        suggestions: [{ message: "Would you like me to draft replies?", kind: "follow-up" }],
      },
    });

    expect(view?.activities[0]?.userLabel).toBe("Reviewing emails…");
    expect(view?.suggestions.length).toBe(1);
    expect(view?.completed).toBe(true);
  });
});

describe("useProductivitySession", () => {
  it("shows productivity when loading with activities", () => {
    const { result } = renderHook(() =>
      useProductivitySession({
        loading: true,
        taskOutput: {
          productivity: {
            activities: [
              {
                kind: "task-planning",
                userLabel: "Organizing priorities…",
                message: "",
                completed: false,
                timestamp: "2026-05-27T00:00:00.000Z",
              },
            ],
          },
        },
      }),
    );

    expect(result.current.showProductivity).toBe(true);
    expect(result.current.displayLabel).toBe("Organizing priorities…");
  });
});

describe("ProductivityDashboard", () => {
  it("renders timeline without internal runtime names", () => {
    render(
      <ProductivityDashboard
        visible
        loading
        displayLabel="Reviewing emails…"
        productivity={{
          activities: [
            {
              kind: "communication",
              userLabel: "Reviewing emails…",
              message: "Summarized inbox",
              completed: false,
              timestamp: "2026-05-27T00:00:00.000Z",
            },
          ],
          suggestions: [],
          taskCount: 1,
          completed: false,
        }}
      />,
    );

    expect(screen.getByTestId("productivity-dashboard")).toBeTruthy();
    expect(screen.getByTestId("productivity-timeline")).toBeTruthy();
    expect(screen.getByTestId("productivity-active-label").textContent).toContain(
      "Reviewing emails…",
    );
    expect(screen.queryByText(/Hermes/i)).toBeNull();
    expect(screen.queryByText(/OpenClaw/i)).toBeNull();
  });
});
