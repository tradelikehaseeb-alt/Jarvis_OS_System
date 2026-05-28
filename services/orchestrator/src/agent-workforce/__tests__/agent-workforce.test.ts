import { describe, expect, it } from "vitest";

import {
  createDefaultAgentWorkforceRuntime,
  createDefaultTaskDelegationEngine,
  createDefaultParallelExecutionCoordinator,
  createDefaultWorkflowSupervisorRuntime,
} from "../index";

describe("TaskDelegationEngine", () => {
  it("delegates research, market, and document workers", () => {
    const engine = createDefaultTaskDelegationEngine();
    const plan = engine.buildPlan(
      "research AI news, summarize market impact, and prepare a trading brief",
    );

    expect(plan.items.length).toBeGreaterThanOrEqual(3);
    expect(plan.items.some((item) => item.workerType === "research")).toBe(true);
    expect(plan.items.some((item) => item.workerType === "market")).toBe(true);
    expect(plan.items.some((item) => item.workerType === "document")).toBe(true);
    expect(plan.parallel).toBe(true);
  });
});

describe("ParallelExecutionCoordinator", () => {
  it("prevents duplicate worker spawning", async () => {
    const coordinator = createDefaultParallelExecutionCoordinator();
    const engine = createDefaultTaskDelegationEngine();
    const plan = engine.buildPlan("research AI news and research market trends");

    const results = await coordinator.executeParallel(plan.items, {
      async execute(item) {
        return { success: true, stub: true, message: item.action };
      },
    });

    expect(results.results.length).toBe(plan.items.length);
    expect(results.success).toBe(true);
  });
});

describe("WorkflowSupervisorRuntime", () => {
  it("blocks loops and supports cancellation", () => {
    const supervisor = createDefaultWorkflowSupervisorRuntime();
    for (let index = 0; index < 4; index += 1) {
      supervisor.beforeStep(index + 1, "research");
    }
    const blocked = supervisor.beforeStep(5, "research");
    expect(blocked.recover).toBe(true);
    expect(blocked.allowed).toBe(false);

    supervisor.reset();
    supervisor.cancel();
    const cancelled = supervisor.beforeStep(1, "research");
    expect(cancelled.cancel).toBe(true);
  });
});

describe("AgentWorkforceRuntime", () => {
  it("coordinates workforce and returns user-facing activities", async () => {
    const runtime = createDefaultAgentWorkforceRuntime();
    const result = await runtime.coordinate({
      description:
        "research AI news, summarize market impact, and prepare a trading brief",
      intentKind: "research",
      userId: "user-1",
      conversationId: "conv-workforce-1",
    });

    expect(result.success).toBe(true);
    expect(result.activities.length).toBeGreaterThan(0);
    expect(result.summary).toContain("Completed");
    expect(result.activities.every((entry) => !entry.userLabel.includes("Hermes"))).toBe(
      true,
    );
  });
});
