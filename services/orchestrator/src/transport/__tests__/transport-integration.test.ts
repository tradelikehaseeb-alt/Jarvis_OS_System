import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  createDefaultExecutionLifecycleManager,
  createDefaultMemoryPersistenceManager,
  createLocalEventStreamManager,
  createTestOrchestratorService,
} from "../../index";

describe("transport integration", () => {
  it("streams lifecycle events through local event transport file", async () => {
    const dir = mkdtempSync(join(tmpdir(), "jarvis-stream-file-"));
    const filePath = join(dir, "events.json");

    try {
      const stream = createLocalEventStreamManager(filePath);
      const lifecycle = createDefaultExecutionLifecycleManager();
      const memory = createDefaultMemoryPersistenceManager(undefined, stream);
      const received: string[] = [];

      stream.subscribe({
        subscriberId: "local-transport-sub",
        onEvent: (event) => {
          received.push(event.type);
        },
      });

      const service = await createTestOrchestratorService();
      const { record } = await service.executeCreateTask(
        {
          intent: { kind: "automate", description: "Open dashboard" },
          metadata: { conversationId: "conv-transport-1" },
        },
        {
          streamManager: stream,
          lifecycleManager: lifecycle,
          memoryPersistenceManager: memory,
        },
      );

      expect(record.createTaskResponse.status).toBe("completed");
      expect(received).toContain("planning_started");
      expect(received).toContain("execution_completed");

      const reloadedStream = createLocalEventStreamManager(filePath);
      const persisted = reloadedStream
        .subscribe({
          subscriberId: "noop",
          onEvent: () => undefined,
        });

      persisted();

      const { createLocalEventTransportRuntime } = await import(
        "../create-default-transport-runtime"
      );
      const runtime = createLocalEventTransportRuntime(filePath);
      const messages = runtime.getRecentMessages();

      expect(messages.length).toBeGreaterThan(0);
      expect(messages.some((m) => m.type === "planning_started")).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("preserves in-memory default stream behavior for task execution", async () => {
    const { createDefaultStreamManager } = await import(
      "../../streaming/create-default-stream-manager"
    );
    const stream = createDefaultStreamManager();
    const received: string[] = [];

    stream.subscribe({
      subscriberId: "default-sub",
      onEvent: (event) => received.push(event.type),
    });

    const service = await createTestOrchestratorService();
    const { record } = await service.executeCreateTask(
      { intent: { kind: "plan", description: "Plan week" } },
      { streamManager: stream },
    );

    expect(record.createTaskResponse.status).toBe("completed");
    expect(received).toContain("planning_started");
  });
});
