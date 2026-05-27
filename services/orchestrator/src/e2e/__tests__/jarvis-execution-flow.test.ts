import { describe, expect, it } from "vitest";

import { buildExecutionSummary } from "../build-execution-summary";
import { projectUiFromTaskStatus } from "../project-ui-from-task-status";
import type { JarvisExecutionFlowResult } from "../jarvis-execution-flow-result";

describe("buildExecutionSummary", () => {
  it("formats summary from completed automate flow result shape", () => {
    const result = {
      rawInput: "automate dashboard",
      taskIntent: { kind: "automate", description: "automate dashboard" },
      record: {
        createTaskResponse: {
          taskId: "task-e2e-1",
          status: "completed",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
        taskStatus: {
          taskId: "task-e2e-1",
          status: "completed",
          updatedAt: "2026-01-01T00:00:01.000Z",
          output: {
            routing: { handshake: true },
            memory: { summary: "Completed automate for user-api-stub" },
            executionLifecycle: {
              state: "completed",
              handshake: {
                planningAgentId: "hermes",
                executionAgentId: "openclaw-gateway",
              },
            },
            agentPayload: {
              structuredPlan: { goal: "Open dashboard" },
            },
          },
        },
      },
      steps: [],
      streamEvents: [
        "execution_started",
        "planning_started",
        "planning_completed",
        "execution_completed",
        "memory_saved",
        "conversation_updated",
      ],
      uiProjection: {
        activityEvents: [],
        agentStatus: {
          hermes: "completed",
          openClaw: "completed",
          displayMessage: "Completed",
          memoryUpdating: false,
        },
        streamEventTypes: [],
      },
    } satisfies JarvisExecutionFlowResult;

    const summary = buildExecutionSummary(result);

    expect(summary.taskId).toBe("task-e2e-1");
    expect(summary.completed).toBe(true);
    expect(summary.handshake).toBe(true);
    expect(summary.hermesState).toBe("completed");
    expect(summary.openClawState).toBe("completed");
    expect(summary.responseMessage).toContain("Open dashboard");
  });
});

describe("projectUiFromTaskStatus", () => {
  it("projects agent status from stream events", () => {
    const projection = projectUiFromTaskStatus(
      {
        taskId: "t1",
        status: "completed",
        updatedAt: "2026-01-01T00:00:01.000Z",
        output: {
          executionLifecycle: { state: "completed", handshake: {} },
          memory: { summary: "done" },
        },
      },
      [
        "planning_started",
        "planning_completed",
        "execution_started",
        "execution_completed",
        "memory_saved",
      ],
    );

    expect(projection.agentStatus.hermes).toBe("completed");
    expect(projection.agentStatus.openClaw).toBe("completed");
    expect(projection.streamEventTypes).toHaveLength(5);
  });
});
