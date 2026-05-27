import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { LocalEventTransportProvider } from "../local-event-transport-provider";

describe("LocalEventTransportProvider", () => {
  it("persists messages to disk and reloads on new instance", () => {
    const dir = mkdtempSync(join(tmpdir(), "jarvis-transport-"));
    const filePath = join(dir, "events.json");

    try {
      const writer = new LocalEventTransportProvider(filePath);
      writer.publish({
        type: "planning_started",
        streamSessionId: "stream-1",
        sessionId: "session-1",
        taskId: "task-1",
        userId: "user-1",
        message: "Planning",
      });

      const reader = new LocalEventTransportProvider(filePath);
      const messages = reader.getRecentMessages();

      expect(messages).toHaveLength(1);
      expect(messages[0]?.type).toBe("planning_started");
      expect(reader.getHealth().providerId).toBe("local-event");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
