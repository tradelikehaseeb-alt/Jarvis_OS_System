import { describe, expect, it, afterEach } from "vitest";

import { createDefaultJarvisApiServer } from "../create-default-jarvis-api-server";
import type { JarvisApiServer } from "../jarvis-api-server";

describe("Jarvis API runtime integration", () => {
  let server: JarvisApiServer | undefined;

  afterEach(async () => {
    await server?.stop();
    server = undefined;
  });

  it("runs full HTTP task lifecycle through orchestrator", async () => {
    server = await createDefaultJarvisApiServer({ port: 0 });
    await server.start();

    const health = await server.fetch("/health");
    expect(health.status).toBe(200);
    expect(health.json).toMatchObject({
      service: "jarvis-api-runtime",
      status: "ok",
    });

    const create = await server.fetch("/tasks", {
      method: "POST",
      body: {
        intent: {
          kind: "automate",
          description: "Open dashboard workflow",
        },
        correlationId: "integration-corr-1",
        metadata: { conversationId: "conv-api-1" },
      },
    });

    expect(create.status).toBe(200);
    const createBody = create.json as {
      taskId: string;
      status: string;
      correlationId?: string;
    };
    expect(createBody.status).toBe("completed");
    expect(createBody.correlationId).toBe("integration-corr-1");

    const status = await server.fetch(`/tasks/${createBody.taskId}`);
    expect(status.status).toBe(200);
    const statusBody = status.json as {
      taskId: string;
      status: string;
      output?: Record<string, unknown>;
    };

    expect(statusBody.taskId).toBe(createBody.taskId);
    expect(statusBody.status).toBe("completed");
    expect(statusBody.output?.executionLifecycle).toBeDefined();
    expect(statusBody.output?.routing).toBeDefined();
  });
});
