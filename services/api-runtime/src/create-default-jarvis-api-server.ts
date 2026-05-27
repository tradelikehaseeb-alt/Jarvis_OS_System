import {
  createTestOrchestratorService,
  type TaskLifecycleOperations,
} from "@jarvis/orchestrator";

import type { ApiHealth } from "./api-health";
import { JarvisApiRouter } from "./jarvis-api-router";
import { JarvisApiServer } from "./jarvis-api-server";
import { validateCreateTaskRequest } from "./validate-create-task-request";

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
