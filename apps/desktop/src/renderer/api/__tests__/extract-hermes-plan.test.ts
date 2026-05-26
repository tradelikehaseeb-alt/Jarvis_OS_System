import { describe, expect, it } from "vitest";

import type { TaskStatusResponse } from "@jarvis/types";

import {
  extractHermesPlanFromTaskStatus,
  extractHermesPlanningDetails,
} from "../extract-hermes-plan";

function statusWithOutput(
  output: Record<string, unknown>,
): TaskStatusResponse {
  return {
    taskId: "task-1",
    status: "completed",
    output,
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("extractHermesPlanFromTaskStatus", () => {
  it("returns plan from structuredPlan when routed to Hermes", () => {
    const status = statusWithOutput({
      routing: { selectedAgentId: "hermes", reason: "capability match" },
      agentPayload: {
        structuredPlan: {
          goal: "Plan my week",
          steps: ["Step A", "Step B"],
        },
        plan: { intentKind: "plan", summary: "Plan my week" },
      },
    });

    const plan = extractHermesPlanFromTaskStatus(status);
    expect(plan?.goal).toBe("Plan my week");
    expect(plan?.steps).toEqual(["Step A", "Step B"]);
    expect(plan?.agentId).toBe("hermes");
  });

  it("falls back to plan block when structuredPlan is absent", () => {
    const status = statusWithOutput({
      routing: { selectedAgentId: "hermes" },
      agentPayload: {
        plan: {
          goal: "Organize sprint",
          steps: ["One", "Two"],
          intentKind: "plan",
          summary: "Organize sprint",
        },
      },
    });

    expect(extractHermesPlanFromTaskStatus(status)?.goal).toBe(
      "Organize sprint",
    );
  });

  it("returns undefined for non-Hermes agent", () => {
    const status = statusWithOutput({
      routing: { selectedAgentId: "openclaw-gateway" },
      agentPayload: {
        structuredPlan: { goal: "X", steps: ["a"] },
      },
    });

    expect(extractHermesPlanFromTaskStatus(status)).toBeUndefined();
  });
});

describe("extractHermesPlanningDetails", () => {
  it("extracts metadata for details panel", () => {
    const status = statusWithOutput({
      agentPayload: {
        stub: false,
        plan: { intentKind: "plan" },
        reasoning: { summary: "Planning only" },
        adapter: { adapterId: "hermes-planning-adapter", stub: false },
      },
      routing: { reason: "selected hermes" },
    });

    const details = extractHermesPlanningDetails(status);
    expect(details?.intentKind).toBe("plan");
    expect(details?.adapterId).toBe("hermes-planning-adapter");
    expect(details?.stub).toBe(false);
  });
});
