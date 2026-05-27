import type { TaskChainEvent } from "../task-chain/task-chain-event";

import type { AdaptiveExecuteResult } from "./adaptive-execution-runtime";

/**
 * Maps adaptive execution results to task chain output shape (Phase 78).
 * Preserves Phase 77 `taskChain` interface for Desktop workspace consumers.
 */
export function toTaskChainOutputFromAdaptive(
  result: AdaptiveExecuteResult,
): {
  readonly chainId: string;
  readonly success: boolean;
  readonly stepCount: number;
  readonly stub: boolean;
  readonly plan: AdaptiveExecuteResult["plan"];
  readonly events: readonly TaskChainEvent[];
} {
  if (result.taskChainResult) {
    return {
      chainId: result.taskChainResult.chainId,
      success: result.taskChainResult.success,
      stepCount: result.taskChainResult.executionResults.length,
      stub: result.taskChainResult.stub,
      plan: result.taskChainResult.plan,
      events: result.taskChainResult.events,
    };
  }

  const timestamp = new Date().toISOString();
  const events: TaskChainEvent[] = [
    {
      eventId: `task-chain-adaptive-started`,
      chainId: result.executionId,
      kind: "chain_started",
      timestamp,
      message: `Executing ${result.tasks.length} OpenClaw step(s) adaptively`,
      stub: result.stub,
    },
  ];

  for (const [index, stepResult] of result.executionResults.entries()) {
    const task = result.tasks[index];
    events.push({
      eventId: `task-chain-adaptive-step-${index}`,
      chainId: result.executionId,
      kind: "step_completed",
      stepIndex: task?.index ?? index,
      stepId: task?.stepId,
      timestamp,
      message: stepResult.success
        ? "OpenClaw step completed"
        : "OpenClaw step failed",
      stub: result.stub,
    });
  }

  events.push({
    eventId: `task-chain-adaptive-${result.success ? "completed" : "failed"}`,
    chainId: result.executionId,
    kind: result.success ? "chain_completed" : "chain_failed",
    timestamp,
    message: result.success ? "Task chain completed" : "Task chain failed",
    stub: result.stub,
  });

  return {
    chainId: result.executionId,
    success: result.success,
    stepCount: result.executionResults.length,
    stub: result.stub,
    plan: result.plan,
    events,
  };
}
