import { describe, expect, it, vi } from "vitest";
import type { AgentContext } from "@jarvis/agents-shared";
import type { HermesExecutionPlan } from "@jarvis/hermes";

import {
  __buildPlanningResultForTest,
  __buildSuccessAgentResultForTest,
  createDefaultTaskChainRuntime,
} from "../../task-chain/create-default-task-chain-runtime";
import {
  __buildEvaluateInputForTest,
  createDefaultAdaptiveExecutionRuntime,
  DEFAULT_STUB_ADAPTIVE_RULES,
} from "../create-default-adaptive-execution-runtime";

describe("AdaptiveExecutionRuntime", () => {
  const agentContext: AgentContext = {
    contextRef: "ctx-adaptive",
    userId: "user-1",
  };

  function createRuntime(
    executeOpenClawStep = vi.fn(async (descriptor, requestId) =>
      __buildSuccessAgentResultForTest(descriptor, requestId),
    ),
  ) {
    const taskChainRuntime = createDefaultTaskChainRuntime({ executeOpenClawStep });
    return {
      runtime: createDefaultAdaptiveExecutionRuntime({
        taskChainRuntime,
        executeOpenClawStep,
      }),
      executeOpenClawStep,
      taskChainRuntime,
    };
  }

  it("evaluateExecution continues on success", () => {
    const { runtime, taskChainRuntime } = createRuntime();
    const plan = taskChainRuntime.createExecutionPlan({
      parentTaskId: "task-1",
      structuredPlan: { goal: "Goal", steps: ["A", "B"] },
    });
    const tasks = taskChainRuntime.mapPlanToTasks({
      plan,
      parentTaskId: "task-1",
      userId: "user-1",
    });

    const decision = runtime.evaluateExecution(
      __buildEvaluateInputForTest(true, 0, 0, plan, tasks[0]!),
    );

    expect(decision.kind).toBe("continue");
  });

  it("evaluateExecution retries then aborts on persistent failure", () => {
    const { runtime, taskChainRuntime } = createRuntime();
    const plan = taskChainRuntime.createExecutionPlan({
      parentTaskId: "task-retry",
      structuredPlan: { goal: "Goal", steps: ["A"] },
    });
    const tasks = taskChainRuntime.mapPlanToTasks({
      plan,
      parentTaskId: "task-retry",
      userId: "user-1",
    });

    const retryDecision = runtime.evaluateExecution(
      __buildEvaluateInputForTest(false, 0, 0, plan, tasks[0]!),
    );
    expect(retryDecision.kind).toBe("retry");

    const abortDecision = runtime.evaluateExecution(
      __buildEvaluateInputForTest(false, 0, 1, plan, tasks[0]!),
    );
    expect(abortDecision.kind).toBe("abort");
  });

  it("selectNextStep returns the next descriptor on continue", () => {
    const { runtime, taskChainRuntime } = createRuntime();
    const plan = taskChainRuntime.createExecutionPlan({
      parentTaskId: "task-next",
      structuredPlan: { goal: "Goal", steps: ["A", "B"] },
    });
    const tasks = taskChainRuntime.mapPlanToTasks({
      plan,
      parentTaskId: "task-next",
      userId: "user-1",
    });

    const next = runtime.selectNextStep({
      tasks,
      currentIndex: 0,
      decision: { kind: "continue", reason: "ok" },
    });

    expect(next?.stepId).toBe(tasks[1]?.stepId);
  });

  it("modifyExecutionPlan replaces remaining steps", () => {
    const { runtime, taskChainRuntime } = createRuntime();
    const plan = taskChainRuntime.createExecutionPlan({
      parentTaskId: "task-mod",
      structuredPlan: { goal: "Goal", steps: ["A", "B", "C"] },
    });

    const modified = runtime.modifyExecutionPlan({
      plan,
      parentTaskId: "task-mod",
      completedStepCount: 1,
      newRemainingSteps: ["B-revised", "C-revised"],
    });

    expect(modified.steps).toHaveLength(3);
    expect(modified.steps[1]?.label).toBe("B-revised");
    expect(modified.steps[2]?.label).toBe("C-revised");
  });

  it("retryExecution delegates to OpenClaw step executor", async () => {
    const executeOpenClawStep = vi.fn(async (descriptor, requestId) =>
      __buildSuccessAgentResultForTest(descriptor, requestId),
    );
    const { runtime, taskChainRuntime } = createRuntime(executeOpenClawStep);
    const plan = taskChainRuntime.createExecutionPlan({
      parentTaskId: "task-retry-exec",
      structuredPlan: { goal: "Goal", steps: ["A"] },
    });
    const tasks = taskChainRuntime.mapPlanToTasks({
      plan,
      parentTaskId: "task-retry-exec",
      userId: "user-1",
    });

    await runtime.retryExecution({
      descriptor: tasks[0]!,
      requestId: "req-retry",
      agentContext,
      retryCount: 1,
    });

    expect(executeOpenClawStep).toHaveBeenCalledWith(
      tasks[0],
      "req-retry-retry-1",
      agentContext,
    );
  });

  it("executeAdaptively runs all steps with adaptive decisions", async () => {
    const { runtime } = createRuntime();
    const planningResult = __buildPlanningResultForTest("task-adaptive");

    const result = await runtime.executeAdaptively({
      chainId: "chain-adaptive",
      parentTaskId: "task-adaptive",
      requestId: "req-adaptive",
      userId: "user-1",
      planningResult,
      agentContext,
      sessionId: "session-adaptive",
    });

    expect(result.success).toBe(true);
    expect(result.adaptive).toBe(true);
    expect(result.executionResults.length).toBe(2);
    expect(result.decisions.length).toBeGreaterThan(0);
    expect(
      result.events.some((event) => event.kind === "execution_completed"),
    ).toBe(true);
  });

  it("executeAdaptively falls back to fixed chain when useFixedChain is set", async () => {
    const { runtime } = createRuntime();
    const planningResult = __buildPlanningResultForTest("task-fixed");

    const result = await runtime.executeAdaptively({
      chainId: "chain-fixed",
      parentTaskId: "task-fixed",
      requestId: "req-fixed",
      userId: "user-1",
      planningResult,
      agentContext,
      sessionId: "session-fixed",
      useFixedChain: true,
    });

    expect(result.taskChainResult).toBeDefined();
    expect(result.taskChainResult?.success).toBe(true);
  });

  it("uses default stub adaptive rules", () => {
    expect(DEFAULT_STUB_ADAPTIVE_RULES.length).toBeGreaterThan(0);
  });
});
