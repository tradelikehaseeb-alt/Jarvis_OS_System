import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WorkspaceSessionPanel } from "../WorkspaceSessionPanel";

describe("WorkspaceSessionPanel", () => {
  it("renders active session details", () => {
    render(
      <WorkspaceSessionPanel
        session={{
          sessionId: "ws-1",
          conversationId: "conv-1",
          status: "active",
          createdAt: "2026-05-27T12:00:00.000Z",
          updatedAt: "2026-05-27T12:00:00.000Z",
          historyTurns: [
            {
              role: "user",
              message: "Plan my week",
              timestamp: "2026-05-27T12:00:00.000Z",
            },
          ],
          relatedMemories: [
            { id: "m-1", content: "Prior sprint notes", source: "memory", score: 1 },
          ],
          timelineSteps: [
            {
              id: "t-1",
              kind: "planning_started",
              label: "Planning started",
              timestamp: "2026-05-27T12:00:01.000Z",
              status: "complete",
            },
          ],
          runtimeState: { phase: "completed", healthy: true, message: "Task completed" },
        }}
      />,
    );

    expect(screen.getByTestId("workspace-session-panel")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-history")).toHaveTextContent("Plan my week");
    expect(screen.getByTestId("workspace-memories")).toHaveTextContent("Prior sprint notes");
    expect(screen.getByTestId("workspace-timeline")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-runtime-state")).toHaveAttribute(
      "data-phase",
      "completed",
    );
  });
});
