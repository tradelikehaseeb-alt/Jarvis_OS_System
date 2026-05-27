import type { AgentResult } from "@jarvis/agents-shared";

import type { ExecutionLifecycleManager } from "./execution-lifecycle-manager";

function readRecord(
  payload: Readonly<Record<string, unknown>> | undefined,
  key: string,
): Readonly<Record<string, unknown>> | undefined {
  const value = payload?.[key];
  return value && typeof value === "object"
    ? (value as Readonly<Record<string, unknown>>)
    : undefined;
}

/**
 * Emit Hermes planning activities from agent gateway payload (Phase 45).
 */
export function emitHermesPlanningActivities(
  lifecycle: ExecutionLifecycleManager,
  sessionId: string,
  taskId: string,
  result: AgentResult,
): void {
  lifecycle.emitActivity(sessionId, {
    taskId,
    source: "hermes",
    kind: "planning_started",
    summary: "Hermes planning started",
  });

  const plan = readRecord(result.payload, "structuredPlan") ??
    readRecord(result.payload, "plan");
  if (plan) {
    lifecycle.emitActivity(sessionId, {
      taskId,
      source: "hermes",
      kind: "plan_generated",
      summary:
        typeof plan.goal === "string"
          ? `Plan generated: ${plan.goal}`
          : "Structured plan generated",
      payload: { plan },
    });
  }

  const gateway = readRecord(result.payload, "gateway");
  if (gateway) {
    lifecycle.emitActivity(sessionId, {
      taskId,
      source: "hermes",
      kind: "execution_progress",
      summary: "Hermes gateway runtime status reported",
      payload: {
        runtimeStatus: gateway.runtimeStatus,
        stub: gateway.stub,
      },
    });
  }

  lifecycle.emitActivity(sessionId, {
    taskId,
    source: "hermes",
    kind: "planning_completed",
    summary: result.success
      ? "Hermes planning completed"
      : "Hermes planning failed",
    payload: {
      success: result.success,
      error: result.error,
    },
  });
}

/**
 * Emit OpenClaw execution activities from agent gateway payload (Phase 45).
 */
export function emitOpenClawExecutionActivities(
  lifecycle: ExecutionLifecycleManager,
  sessionId: string,
  taskId: string,
  result: AgentResult,
): void {
  lifecycle.emitActivity(sessionId, {
    taskId,
    source: "openclaw",
    kind: "execution_started",
    summary: "OpenClaw execution started",
  });

  const gateway = readRecord(result.payload, "gateway");
  const execution = readRecord(result.payload, "execution");
  const runtimeStatus =
    gateway?.runtimeStatus ?? execution?.runtimeStatus;

  if (runtimeStatus !== undefined) {
    lifecycle.emitActivity(sessionId, {
      taskId,
      source: "openclaw",
      kind: "execution_progress",
      summary: `OpenClaw runtime status: ${String(runtimeStatus)}`,
      payload: {
        runtimeStatus,
        handleId: execution?.handleId ?? gateway?.executionHandleId,
      },
    });
  }

  lifecycle.emitActivity(sessionId, {
    taskId,
    source: "openclaw",
    kind: "execution_completed",
    summary: result.success
      ? "OpenClaw execution completed"
      : "OpenClaw execution failed",
    payload: {
      success: result.success,
      approvedActions: gateway?.approvedActions,
      error: result.error,
    },
  });
}
