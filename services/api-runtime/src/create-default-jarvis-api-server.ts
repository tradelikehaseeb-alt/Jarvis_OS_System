import {
  createTestOrchestratorService,
  type TaskLifecycleOperations,
} from "@jarvis/orchestrator";

import type { ApiHealth } from "./api-health";
import { JarvisApiRouter } from "./jarvis-api-router";
import { JarvisApiServer } from "./jarvis-api-server";
import { validateCreateTaskRequest } from "./validate-create-task-request";
import { countMemoryFacts, registerMemoryRoutes } from "./memory-routes";

export interface CreateDefaultJarvisApiServerOptions {
  readonly port?: number;
  readonly orchestrator?: TaskLifecycleOperations;
}

function buildHealth(orchestratorReady: boolean): ApiHealth {
  return {
    status: orchestratorReady ? "ok" : "degraded",
    service: "jarvis-api-runtime",
    orchestrator: orchestratorReady ? "ok" : "degraded",
    checkedAt: new Date().toISOString(),
  };
}

function registerDefaultRoutes(
  router: JarvisApiRouter,
  orchestrator: TaskLifecycleOperations,
): void {
  router.get("/health", () => ({
    status: 200,
    body: buildHealth(true),
  }));

  router.get("/api/dashboard", async () => ({
    status: 200,
    body: {
      status: "ok",
      memoryStatus: "ok",
      factsCount: await countMemoryFacts(),
      activeTasks: 0,
      checkedAt: new Date().toISOString(),
    },
  }));

  router.get("/tasks/recent", async () => ({
    status: 200,
    body: { tasks: [], limit: 10, source: "api-runtime" },
  }));

  registerMemoryRoutes(router);

  router.post("/tasks", async (request) => {
    const validated = validateCreateTaskRequest(request.body);
    if ("status" in validated) {
      return validated;
    }

    const { record } = await orchestrator.executeCreateTask(validated);
    return {
      status: 200,
      body: record.createTaskResponse,
    };
  });

  router.get("/tasks/:id/stream", async (request) => {
    const taskId = request.params.id?.trim() ?? "";
    if (!taskId) {
      return {
        status: 422,
        error: {
          code: "VALIDATION_ERROR",
          message: "taskId must not be empty",
        },
      };
    }

    const terminal = new Set(["completed", "failed", "cancelled"]);
    const events: string[] = [];

    for (let attempt = 0; attempt < 60; attempt += 1) {
      const status = await orchestrator.getTaskStatus(taskId);
      if (!status) {
        return {
          status: 404,
          error: {
            code: "TASK_NOT_FOUND",
            message: `Task ${taskId} not found`,
          },
        };
      }

      const payload = JSON.stringify({
        ...status,
        progressPercent:
          status.status === "completed" || status.status === "failed"
            ? 100
            : status.progressPercent,
      });
      events.push(`event: status\ndata: ${payload}\n\n`);

      if (terminal.has(status.status)) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
      body: events.join(""),
    };
  });

  router.get("/tasks/:id", async (request) => {
    const taskId = request.params.id?.trim() ?? "";
    if (!taskId) {
      return {
        status: 422,
        error: {
          code: "VALIDATION_ERROR",
          message: "taskId must not be empty",
        },
      };
    }

    const status = await orchestrator.getTaskStatus(taskId);
    if (!status) {
      return {
        status: 404,
        error: {
          code: "TASK_NOT_FOUND",
          message: `Task ${taskId} not found`,
        },
      };
    }

    return {
      status: 200,
      body: {
        ...status,
        progressPercent:
          status.status === "completed" || status.status === "failed"
            ? 100
            : status.progressPercent,
      },
    };
  });
}

/**
 * Factory for Jarvis API runtime server wired to orchestrator (Phase 53).
 */
export async function createDefaultJarvisApiServer(
  options: CreateDefaultJarvisApiServerOptions = {},
): Promise<JarvisApiServer> {
  const orchestrator =
    options.orchestrator ?? (await createTestOrchestratorService());
  const router = new JarvisApiRouter();
  registerDefaultRoutes(router, orchestrator);
  return new JarvisApiServer(router, options.port ?? 0);
}

export { registerDefaultRoutes, buildHealth };
export { registerMemoryRoutes, countMemoryFacts } from "./memory-routes";
