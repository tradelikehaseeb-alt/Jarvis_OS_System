import { describe, expect, it } from "vitest";
import type {
  AgentRequest,
  AgentResponse,
  TaskIntent,
  TaskResult,
  UserTask,
  WorkflowStep,
} from "../index";

/** Satisfies {@link TaskIntent} for structural tests. */
const sampleIntent: TaskIntent = {
  kind: "automate",
  description: "Organize downloads folder",
  priority: "normal",
};

/** Satisfies {@link UserTask} for structural tests. */
const sampleTask: UserTask = {
  id: "task-001",
  userId: "user-001",
  intent: sampleIntent,
  createdAt: "2026-05-25T00:00:00.000Z",
};

describe("Jarvis Core contracts", () => {
  it("UserTask accepts required fields", () => {
    expect(sampleTask.id).toBe("task-001");
    expect(sampleTask.intent.kind).toBe("automate");
  });

  it("TaskResult supports terminal status", () => {
    const result: TaskResult = {
      taskId: sampleTask.id,
      status: "completed",
      output: { summary: "done" },
      completedAt: "2026-05-25T01:00:00.000Z",
    };
    expect(result.status).toBe("completed");
  });

  it("AgentRequest links task and agent", () => {
    const request: AgentRequest = {
      requestId: "req-001",
      agentId: "hermes",
      task: sampleTask,
      contextRef: "ctx-001",
    };
    expect(request.agentId).toBe("hermes");
  });

  it("AgentResponse supports failure shape", () => {
    const response: AgentResponse = {
      requestId: "req-001",
      agentId: "hermes",
      success: false,
      error: { code: "PLAN_FAILED", message: "Unavailable" },
    };
    expect(response.success).toBe(false);
  });

  it("WorkflowStep supports dependency graph fields", () => {
    const step: WorkflowStep = {
      stepId: "step-1",
      order: 0,
      name: "Plan",
      agentId: "hermes",
      dependsOn: [],
    };
    expect(step.order).toBe(0);
  });
});
