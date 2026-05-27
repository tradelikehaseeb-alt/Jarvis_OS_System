import { afterEach, describe, expect, it } from "vitest";

import { createDefaultJarvisApiServer } from "@jarvis/api-runtime";
import type { JarvisApiServer } from "@jarvis/api-runtime";

import { deriveAgentStatus } from "../../agent-status/derive-agent-status";
import { mapTaskStatusToActivityEvents } from "../../activity/map-task-status-events";
import { classifyChatIntent } from "../../intent";
import { buildTaskIntentFromClassification } from "../../intent";
import { isApiHealthy } from "../../api/api-communication";

describe("Desktop API runtime integration", () => {
  let server: JarvisApiServer | undefined;

  afterEach(async () => {
    await server?.stop();
    server = undefined;
  });

  async function submitThroughApiRuntime(message: string) {
    if (!server) {
      throw new Error("Server not started");
    }

    const classification = classifyChatIntent(message);
    const intent = buildTaskIntentFromClassification(message, classification);

    const health = await server.fetch("/health");
    expect(isApiHealthy(health.json as Parameters<typeof isApiHealthy>[0])).toBe(
      true,
    );

    const createResponse = await server.fetch("/tasks", {
      method: "POST",
      body: {
        intent,
        correlationId: "desktop-api-integration",
        metadata: {
          source: "desktop-chat",
          classifiedIntent: classification.intent,
        },
      },
    });

    expect(createResponse.status).toBe(200);
    const create = createResponse.json as { taskId: string; status: string };

    const statusResponse = await server.fetch(`/tasks/${create.taskId}`);
    expect(statusResponse.status).toBe(200);

    return {
      classification,
      create,
      status: statusResponse.json as {
        taskId: string;
        status: string;
        output?: Record<string, unknown>;
      },
    };
  }

  it("routes automate tasks through API runtime to activity and agent status", async () => {
    server = await createDefaultJarvisApiServer({ port: 0 });
    await server.start();

    const result = await submitThroughApiRuntime(
      "automate opening the dashboard workflow",
    );

    expect(result.classification.intent).toBe("automate");
    expect(result.status.status).toBe("completed");

    const activityEvents = mapTaskStatusToActivityEvents(
      result.status as import("@jarvis/types").TaskStatusResponse,
    );
    expect(activityEvents.length).toBeGreaterThan(0);

    const agentStatus = deriveAgentStatus(activityEvents, false);
    expect(agentStatus.hermes).toBe("completed");
    expect(agentStatus.openClaw).toBe("completed");
    expect(agentStatus.displayMessage).toBe("Completed");
  });

  it("routes plan tasks through API runtime for Hermes-only path", async () => {
    server = await createDefaultJarvisApiServer({ port: 0 });
    await server.start();

    const result = await submitThroughApiRuntime("Plan my week");

    expect(result.classification.intent).toBe("plan");
    expect(result.status.status).toBe("completed");

    const activityEvents = mapTaskStatusToActivityEvents(
      result.status as import("@jarvis/types").TaskStatusResponse,
    );
    const agentStatus = deriveAgentStatus(activityEvents, false);
    expect(agentStatus.hermes).toBe("completed");
    expect(agentStatus.openClaw).not.toBe("executing");
  });
});
