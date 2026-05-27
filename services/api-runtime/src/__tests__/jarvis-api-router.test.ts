import { describe, expect, it } from "vitest";

import { JarvisApiRouter } from "../jarvis-api-router";

describe("JarvisApiRouter", () => {
  it("matches parameterized routes and returns 404 for unknown paths", async () => {
    const router = new JarvisApiRouter();

    router.get("/health", () => ({
      status: 200,
      body: { status: "ok" },
    }));

    router.get("/tasks/:id", (request) => ({
      status: 200,
      body: { taskId: request.params.id },
    }));

    const health = await router.dispatch({
      method: "GET",
      path: "/health",
      params: {},
      query: {},
      body: undefined,
      headers: {},
    });

    expect(health.body).toEqual({ status: "ok" });

    const task = await router.dispatch({
      method: "GET",
      path: "/tasks/task-123",
      params: {},
      query: {},
      body: undefined,
      headers: {},
    });

    expect(task.body).toEqual({ taskId: "task-123" });

    const missing = await router.dispatch({
      method: "GET",
      path: "/missing",
      params: {},
      query: {},
      body: undefined,
      headers: {},
    });

    expect(missing.status).toBe(404);
    expect(missing.error?.code).toBe("NOT_FOUND");
  });
});
