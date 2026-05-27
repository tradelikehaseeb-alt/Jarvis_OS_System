import { describe, expect, it } from "vitest";

import { createDefaultJarvisApiServer } from "../create-default-jarvis-api-server";

describe("JarvisApiServer", () => {
  it("handles health and task routes without binding a port", async () => {
    const server = await createDefaultJarvisApiServer();

    const health = await server.handleRequest({
      method: "GET",
      path: "/health",
      params: {},
      query: {},
      body: undefined,
      headers: {},
    });

    expect(health.status).toBe(200);
    expect(health.body).toMatchObject({
      service: "jarvis-api-runtime",
      orchestrator: "ok",
    });

    const created = await server.handleRequest({
      method: "POST",
      path: "/tasks",
      params: {},
      query: {},
      body: {
        intent: { kind: "plan", description: "Plan sprint" },
        correlationId: "corr-api-1",
      },
      headers: {},
    });

    expect(created.status).toBe(200);
    const createBody = created.body as { taskId: string; correlationId?: string };
    expect(createBody.taskId).toBeTruthy();
    expect(createBody.correlationId).toBe("corr-api-1");

    const status = await server.handleRequest({
      method: "GET",
      path: `/tasks/${createBody.taskId}`,
      params: { id: createBody.taskId },
      query: {},
      body: undefined,
      headers: {},
    });

    expect(status.status).toBe(200);
    const statusBody = status.body as { taskId: string; status: string };
    expect(statusBody.taskId).toBe(createBody.taskId);
    expect(statusBody.status).toBe("completed");
  });

  it("returns validation and not-found errors", async () => {
    const server = await createDefaultJarvisApiServer();

    const invalid = await server.handleRequest({
      method: "POST",
      path: "/tasks",
      params: {},
      query: {},
      body: { intent: { kind: "", description: "x" } },
      headers: {},
    });

    expect(invalid.status).toBe(422);
    expect(invalid.error?.code).toBe("VALIDATION_ERROR");

    const missing = await server.handleRequest({
      method: "GET",
      path: "/tasks/missing-task",
      params: { id: "missing-task" },
      query: {},
      body: undefined,
      headers: {},
    });

    expect(missing.status).toBe(404);
    expect(missing.error?.code).toBe("TASK_NOT_FOUND");
  });
});
