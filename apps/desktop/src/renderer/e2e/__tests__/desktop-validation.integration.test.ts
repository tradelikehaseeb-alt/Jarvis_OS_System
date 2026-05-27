import { afterEach, describe, expect, it } from "vitest";

import { DESKTOP_VALIDATION_PROMPTS } from "@jarvis/types";
import { createDefaultJarvisApiServer } from "@jarvis/api-runtime";
import type { JarvisApiServer } from "@jarvis/api-runtime";

import { classifyChatIntent } from "../../intent";
import { buildTaskIntentFromClassification } from "../../intent";
import { deriveAgentStatus } from "../../agent-status/derive-agent-status";
import { mapTaskStatusToActivityEvents } from "../../activity/map-task-status-events";
import { isApiHealthy } from "../../api/api-communication";

describe("Phase 87 desktop validation prompts", () => {
  let server: JarvisApiServer | undefined;

  afterEach(async () => {
    await server?.stop();
    server = undefined;
  });

  it.each(DESKTOP_VALIDATION_PROMPTS)(
    "routes validation prompt through full desktop stack: %s",
    async (prompt) => {
      server = await createDefaultJarvisApiServer({ port: 0 });
      await server.start();

      const classification = classifyChatIntent(prompt);
      expect(classification.intent).toBe("automate");

      const intent = buildTaskIntentFromClassification(prompt, classification);
      const health = await server.fetch("/health");
      expect(isApiHealthy(health.json as Parameters<typeof isApiHealthy>[0])).toBe(
        true,
      );

      const createResponse = await server.fetch("/tasks", {
        method: "POST",
        body: {
          intent,
          correlationId: "phase-87-desktop-validation",
          metadata: { source: "desktop-chat" },
        },
      });
      expect(createResponse.status).toBe(200);

      const create = createResponse.json as { taskId: string };
      const statusResponse = await server.fetch(`/tasks/${create.taskId}`);
      const status = statusResponse.json as import("@jarvis/types").TaskStatusResponse;

      expect(status.status).toBe("completed");

      const activityEvents = mapTaskStatusToActivityEvents(status);
      expect(activityEvents.length).toBeGreaterThan(0);

      const agentStatus = deriveAgentStatus(activityEvents, false);
      expect(agentStatus.hermes).toBe("completed");
      expect(agentStatus.openClaw).toBe("completed");
    },
  );
});
