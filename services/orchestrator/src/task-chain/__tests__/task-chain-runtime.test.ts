import { describe, expect, it, vi } from "vitest";
import type { AgentContext } from "@jarvis/agents-shared";

import {
  __buildPlanningResultForTest,
  __buildSuccessAgentResultForTest,
  createDefaultTaskChainRuntime,
  TASK_CHAIN_EVENT_LABELS,
} from "../create-default-task-chain-runtime";

describe("TaskChainRuntime", () => {
  const agentContext: AgentContext = {
    contextRef: "ctx-chain",
    userId: "user-1",
  };

  it("createExecutionPlan delegates to Hermes bridge", () => {
    const runtime = createDefaultTaskChainRuntime({
      executeOpenClawStep: vi.fn(),
    });

    const plan = runtime.createExecutionPlan({
      parentTaskId: "task-plan",
      structuredPlan: { goal: "Goal", steps: ["A", "B"] },
    });

    expect(plan.goal).toBe("Goal");
    expect(plan.steps).toHaveLength(2);
  });

  it("mapPlanToTasks returns automate intents", () => {
    const runtime = createDefaultTaskChainRuntime({
      executeOpenClawStep: vi.fn(),
    });
    const plan = runtime.createExecutionPlan({
      parentTaskId: "task-map",
      structuredPlan: { goal: "Export", steps: ["Open file"] },
    });

    const tasks = runtime.mapPlanToTasks({
      plan,
      parentTaskId: "task-map",
      userId: "user-1",
    });

    expect(tasks[0]?.intent.kind).toBe("automate");
  });

  it("executeTaskChain runs OpenClaw steps sequentially", async () => {
    const executeOpenClawStep = vi.fn(async (descriptor, requestId) =>
      __buildSuccessAgentResultForTest(descriptor, requestId),
    );

    const runtime = createDefaultTaskChainRuntime({ executeOpenClawStep });
    const planningResult = __buildPlanningResultForTest("task-chain");

    const result = await runtime.executeTaskChain({
      chainId: "chain-1",
      parentTaskId: "task-chain",
      requestId: "req-chain",
      userId: "user-1",
      planningResult,
      agentContext,
      sessionId: "session-1",
    });

    expect(result.success).toBe(true);
    expect(result.executionResults).toHaveLength(2);
    expect(executeOpenClawStep).toHaveBeenCalledTimes(2);
    expect(
      result.events.some((event) => event.kind === "chain_started"),
    ).toBe(true);
    expect(
      result.events.some((event) => event.kind === "chain_completed"),
    ).toBe(true);
  });

  it("executeTaskChain fails when a step fails", async () => {
    const executeOpenClawStep = vi.fn(async (descriptor, requestId) => {
      if (descriptor.index === 1) {
        return {
          taskId: descriptor.taskId,
          requestId,
          agentId: "openclaw-gateway",
          success: false,
          error: { code: "STEP_FAILED", message: "boom" },
        };
      }
      return __buildSuccessAgentResultForTest(descriptor, requestId);
    });

    const runtime = createDefaultTaskChainRuntime({ executeOpenClawStep });
    const result = await runtime.executeTaskChain({
      chainId: "chain-fail",
      parentTaskId: "task-fail",
      requestId: "req-fail",
      userId: "user-1",
      planningResult: __buildPlanningResultForTest("task-fail"),
      agentContext,
      sessionId: "session-fail",
    });

    expect(result.success).toBe(false);
    expect(result.events.some((event) => event.kind === "chain_failed")).toBe(
      true,
    );
  });

  it("subscribeTaskChain receives live events", async () => {
    const runtime = createDefaultTaskChainRuntime({
      executeOpenClawStep: vi.fn(async (descriptor, requestId) =>
        __buildSuccessAgentResultForTest(descriptor, requestId),
      ),
    });

    const received: string[] = [];
    runtime.subscribeTaskChain({
      subscriberId: "sub-1",
      onEvent: (event) => {
        received.push(event.kind);
      },
    });

    await runtime.executeTaskChain({
      chainId: "chain-sub",
      parentTaskId: "task-sub",
      requestId: "req-sub",
      userId: "user-1",
      planningResult: __buildPlanningResultForTest("task-sub"),
      agentContext,
      sessionId: "session-sub",
    });

    expect(received).toContain("chain_started");
    expect(received).toContain("chain_completed");
    expect(TASK_CHAIN_EVENT_LABELS.chain_completed).toBe("Task chain completed");
  });
});
