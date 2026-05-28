import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderHook } from "@testing-library/react";

import { mapContinuousFromTaskOutput } from "../map-continuous-from-task-output";
import { useContinuousPresence } from "../use-continuous-presence";
import { ContinuousPresencePanel } from "../ContinuousPresencePanel";

describe("mapContinuousFromTaskOutput", () => {
  it("maps orchestrator continuous output to user-facing labels", () => {
    const view = mapContinuousFromTaskOutput({
      continuous: {
        sessionId: "cont-1",
        success: true,
        summary: "Running in background.",
        continuous: true,
        presence: "background",
        backgroundTaskCount: 1,
        activities: [
          {
            kind: "monitor",
            userLabel: "Monitoring…",
            message: "gold market",
            background: true,
            completed: true,
            timestamp: "2026-05-27T00:00:00.000Z",
          },
        ],
        notifications: [
          { kind: "alert", message: "Market monitoring active.", userLabel: "Monitoring…" },
        ],
      },
    });

    expect(view?.continuous).toBe(true);
    expect(view?.notifications.length).toBe(1);
  });
});

describe("useContinuousPresence", () => {
  it("shows continuous presence when background tasks active", () => {
    const { result } = renderHook(() =>
      useContinuousPresence({
        loading: true,
        taskOutput: {
          continuous: {
            continuous: true,
            backgroundTaskCount: 2,
            activities: [
              {
                kind: "watch",
                userLabel: "Watching for updates…",
                message: "",
                background: true,
                completed: false,
                timestamp: "2026-05-27T00:00:00.000Z",
              },
            ],
          },
        },
      }),
    );

    expect(result.current.showContinuous).toBe(true);
    expect(result.current.hasBackgroundTasks).toBe(true);
  });
});

describe("ContinuousPresencePanel", () => {
  it("renders without internal runtime names", () => {
    render(
      <ContinuousPresencePanel
        visible
        loading
        displayLabel="Monitoring…"
        continuous={{
          activities: [
            {
              kind: "monitor",
              userLabel: "Monitoring…",
              message: "gold market",
              background: true,
              completed: false,
              timestamp: "2026-05-27T00:00:00.000Z",
            },
          ],
          notifications: [],
          continuous: true,
          presence: "background",
          backgroundTaskCount: 1,
          completed: false,
        }}
      />,
    );

    expect(screen.getByTestId("continuous-presence-panel")).toBeTruthy();
    expect(screen.getByTestId("continuous-timeline")).toBeTruthy();
    expect(screen.getByTestId("continuous-active-label").textContent).toContain("Monitoring…");
    expect(screen.queryByText(/Hermes/i)).toBeNull();
    expect(screen.queryByText(/OpenClaw/i)).toBeNull();
  });
});
