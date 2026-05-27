import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WorkspaceSidebar } from "../WorkspaceSidebar";

describe("WorkspaceSidebar", () => {
  it("renders sessions and handles selection", () => {
    const onSelect = vi.fn();

    render(
      <WorkspaceSidebar
        sessions={[
          {
            sessionId: "ws-1",
            conversationId: "conv-1",
            status: "active",
            createdAt: "2026-05-27T12:00:00.000Z",
            updatedAt: "2026-05-27T12:00:00.000Z",
            historyTurns: [],
            relatedMemories: [],
            timelineSteps: [],
            runtimeState: { phase: "ready", healthy: true },
          },
        ]}
        activeSessionId="ws-1"
        onSelect={onSelect}
        onCreate={vi.fn()}
        onRestore={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("workspace-session-ws-1"));
    expect(onSelect).toHaveBeenCalledWith("ws-1");
  });
});
