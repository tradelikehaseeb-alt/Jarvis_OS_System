import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { mapWorkforceFromTaskOutput } from "../map-workforce-from-task-output";
import { useWorkforceActivity } from "../use-workforce-activity";
import { WorkforceActivityPanel } from "../WorkforceActivityPanel";
import { renderHook } from "@testing-library/react";

describe("mapWorkforceFromTaskOutput", () => {
  it("maps orchestrator workforce output to user-facing labels", () => {
    const view = mapWorkforceFromTaskOutput({
      workforce: {
        sessionId: "wf-1",
        success: true,
        summary: "Completed research, analysis, and summary.",
        workerCount: 3,
        parallel: true,
        activities: [
          {
            workerType: "research",
            userLabel: "Researching…",
            message: "Research complete",
            completed: true,
            timestamp: "2026-05-27T00:00:00.000Z",
          },
          {
            workerType: "market",
            userLabel: "Analyzing…",
            message: "Analysis complete",
            completed: true,
            timestamp: "2026-05-27T00:00:01.000Z",
          },
        ],
      },
    });

    expect(view?.activities[0]?.userLabel).toBe("Researching…");
    expect(view?.completed).toBe(true);
    expect(view?.summary).toContain("Completed");
  });
});

describe("useWorkforceActivity", () => {
  it("shows workforce when loading with activities", () => {
    const { result } = renderHook(() =>
      useWorkforceActivity({
        loading: true,
        taskOutput: {
          workforce: {
            activities: [
              {
                workerType: "research",
                userLabel: "Researching…",
                message: "",
                completed: false,
                timestamp: "2026-05-27T00:00:00.000Z",
              },
            ],
          },
        },
      }),
    );

    expect(result.current.showWorkforce).toBe(true);
    expect(result.current.displayLabel).toBe("Researching…");
  });
});

describe("WorkforceActivityPanel", () => {
  it("renders timeline without internal runtime names", () => {
    render(
      <WorkforceActivityPanel
        visible
        loading
        displayLabel="Analyzing…"
        workforce={{
          activities: [
            {
              workerType: "research",
              userLabel: "Researching…",
              message: "Gathering sources",
              completed: true,
              timestamp: "2026-05-27T00:00:00.000Z",
            },
            {
              workerType: "market",
              userLabel: "Analyzing…",
              message: "",
              completed: false,
              timestamp: "2026-05-27T00:00:01.000Z",
            },
          ],
          workerCount: 2,
          completed: false,
        }}
      />,
    );

    expect(screen.getByTestId("workforce-activity-panel")).toBeTruthy();
    expect(screen.getByTestId("workforce-timeline")).toBeTruthy();
    expect(screen.getByTestId("workforce-active-label").textContent).toContain("Analyzing…");
    expect(screen.getByTestId("workforce-step-market")).toBeTruthy();
    expect(screen.queryByText(/Hermes/i)).toBeNull();
    expect(screen.queryByText(/OpenClaw/i)).toBeNull();
  });
});
