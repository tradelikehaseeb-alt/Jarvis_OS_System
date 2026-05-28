import { afterEach, describe, expect, it } from "vitest";

import { REAL_WORLD_VOICE_COMMANDS } from "@jarvis/types";
import { createDefaultJarvisApiServer } from "@jarvis/api-runtime";
import type { JarvisApiServer } from "@jarvis/api-runtime";

import { classifyChatIntent } from "../../intent";
import { buildTaskIntentFromClassification } from "../../intent";
import { mapTaskStatusToActivityEvents } from "../../activity/map-task-status-events";

describe("Phase 100 real-world validation", () => {
  let server: JarvisApiServer | undefined;

  afterEach(async () => {
    await server?.stop();
    server = undefined;
  });

  it.each(REAL_WORLD_VOICE_COMMANDS.slice(0, 2))(
    "routes real-world voice command: %s",
    async (command) => {
      server = await createDefaultJarvisApiServer({ port: 0 });
      await server.start();

      const classification = classifyChatIntent(command);
      const intent = buildTaskIntentFromClassification(command, classification);

      const createResponse = await server.fetch("/tasks", {
        method: "POST",
        body: {
          intent,
          correlationId: "phase-100-real-world",
          metadata: { source: "real-world-validation" },
        },
      });
      expect(createResponse.status).toBe(200);

      const create = createResponse.json as { taskId: string };
      const statusResponse = await server.fetch(`/tasks/${create.taskId}`);
      const status = statusResponse.json as import("@jarvis/types").TaskStatusResponse;

      expect(status.status).toBe("completed");
      expect(mapTaskStatusToActivityEvents(status).length).toBeGreaterThan(0);
    },
  );
});
