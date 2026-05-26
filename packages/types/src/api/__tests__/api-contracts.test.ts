import { describe, expect, it } from "vitest";
import type {
  ApiErrorResponse,
  ConversationRequest,
  ConversationResponse,
  CreateTaskRequest,
  CreateTaskResponse,
  TaskStatusResponse,
} from "../index";

describe("API gateway contracts", () => {
  it("CreateTaskRequest accepts TaskIntent", () => {
    const body: CreateTaskRequest = {
      intent: {
        kind: "automate",
        description: "Sort inbox",
        priority: "normal",
      },
      correlationId: "corr-1",
    };
    expect(body.intent.kind).toBe("automate");
  });

  it("CreateTaskResponse returns task id and status", () => {
    const res: CreateTaskResponse = {
      taskId: "task-1",
      status: "queued",
      createdAt: "2026-05-25T12:00:00.000Z",
    };
    expect(res.status).toBe("queued");
  });

  it("TaskStatusResponse supports running progress", () => {
    const res: TaskStatusResponse = {
      taskId: "task-1",
      status: "running",
      progressPercent: 42,
      updatedAt: "2026-05-25T12:01:00.000Z",
    };
    expect(res.progressPercent).toBe(42);
  });

  it("ConversationRequest and ConversationResponse pair", () => {
    const req: ConversationRequest = {
      message: "Hello Jarvis",
    };
    const res: ConversationResponse = {
      sessionId: "sess-1",
      reply: "How can I help?",
      createdAt: "2026-05-25T12:00:00.000Z",
    };
    expect(req.message).toBe("Hello Jarvis");
    expect(res.sessionId).toBe("sess-1");
  });

  it("ApiErrorResponse uses standard error envelope", () => {
    const err: ApiErrorResponse = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid intent",
      },
      requestId: "req-99",
    };
    expect(err.error.code).toBe("VALIDATION_ERROR");
  });
});
