import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RuntimeStartupPanel } from "../RuntimeStartupPanel";

describe("RuntimeStartupPanel", () => {
  it("renders ready startup status", () => {
    render(
      <RuntimeStartupPanel
        status={{
          phase: "ready",
          ready: true,
          initialized: true,
          validated: true,
          recovered: false,
          processCount: 6,
          healthyProcessCount: 6,
          failedProcesses: [],
          message: "Runtime ready",
          updatedAt: "2026-05-27T12:00:00.000Z",
        }}
        events={[
          {
            id: "evt-1",
            kind: "ready",
            message: "Runtime ready",
            timestamp: "2026-05-27T12:00:00.000Z",
          },
        ]}
      />,
    );

    expect(screen.getByTestId("runtime-startup-status")).toHaveAttribute(
      "data-phase",
      "ready",
    );
    expect(screen.getByTestId("runtime-startup-events")).toHaveTextContent(
      "Runtime ready",
    );
  });

  it("invokes recover and refresh handlers", () => {
    const onRecover = vi.fn();
    const onRefresh = vi.fn();

    render(
      <RuntimeStartupPanel
        status={{
          phase: "degraded",
          ready: false,
          initialized: true,
          validated: true,
          recovered: false,
          processCount: 2,
          healthyProcessCount: 1,
          failedProcesses: ["speech-runtime"],
          message: "Degraded runtime",
          updatedAt: "2026-05-27T12:00:00.000Z",
        }}
        onRecover={onRecover}
        onRefresh={onRefresh}
      />,
    );

    fireEvent.click(screen.getByTestId("runtime-startup-recover"));
    fireEvent.click(screen.getByTestId("runtime-startup-refresh"));

    expect(onRecover).toHaveBeenCalled();
    expect(onRefresh).toHaveBeenCalled();
  });
});
