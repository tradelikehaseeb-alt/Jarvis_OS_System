import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ActivityEvent } from "../../activity/activity-event";
import { useAgentStatus } from "../use-agent-status";

const planningEvent: ActivityEvent = {
  id: "1",
  kind: "planning_started",
  label: "Planning started",
  timestamp: "2026-01-01T00:00:01.000Z",
  status: "active",
};

describe("useAgentStatus", () => {
  it("derives loading state from streaming activity", () => {
    const { result } = renderHook(() =>
      useAgentStatus({
        events: [planningEvent],
        isStreaming: true,
      }),
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.status.hermes).toBe("planning");
    expect(result.current.events.some((e) => e.kind === "hermes_planning")).toBe(
      true,
    );
  });

  it("returns idle state when no events", () => {
    const { result } = renderHook(() =>
      useAgentStatus({
        events: [],
        isStreaming: false,
      }),
    );

    expect(result.current.status.hermes).toBe("idle");
    expect(result.current.status.openClaw).toBe("idle");
    expect(result.current.loading).toBe(false);
  });
});
