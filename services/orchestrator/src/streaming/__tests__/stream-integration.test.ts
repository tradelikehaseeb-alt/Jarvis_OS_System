import { describe, expect, it, vi } from "vitest";

import {
  createDefaultExecutionLifecycleManager,
  createDefaultMemoryPersistenceManager,
  createDefaultStreamManager,
  createTestOrchestratorService,
} from "../../index";

describe("streaming integration", () => {
  it("streams lifecycle and memory events during task execution", async () => {
    const stream = createDefaultStreamManager();
    const lifecycle = createDefaultExecutionLifecycleManager();
    const memory = createDefaultMemoryPersistenceManager(undefined, stream);
    const received: string[] = [];

    stream.subscribe({
      subscriberId: "integration-sub",
      onEvent: (event) => {
        received.push(event.type);
      },
    });

    const service = await createTestOrchestratorService();
    const { record } = await service.executeCreateTask(
      {
        intent: { kind: "automate", description: "Open dashboard" },
        metadata: { conversationId: "conv-stream-1" },
      },
      { streamManager: stream, lifecycleManager: lifecycle, memoryPersistenceManager: memory },
    );

    expect(record.createTaskResponse.status).toBe("completed");
    expect(received).toContain("execution_started");
    expect(received).toContain("planning_started");
    expect(received).toContain("planning_completed");
    expect(received).toContain("execution_completed");
    expect(received).toContain("memory_saved");
    expect(received).toContain("conversation_updated");

    const streamOutput = record.taskStatus.output?.stream as {
      streamSessionId: string;
      activeSessions: number;
    };
    expect(streamOutput.streamSessionId).toMatch(/^stream-task-/);
    expect(streamOutput.activeSessions).toBe(0);
  });

  it("publishes failed event when agent is missing", async () => {
    const stream = createDefaultStreamManager();
    const received: string[] = [];
    stream.subscribe({
      subscriberId: "fail-sub",
      onEvent: (event) => received.push(event.type),
    });

    const { createStubComponents } = await import("../../create-orchestrator-service");
    const { OrchestratorServiceImpl } = await import("../../index");
    const { InMemoryAgentRegistry } = await import("@jarvis/agents-shared");
    const { InMemoryTaskStore } = await import("../../storage");

    const service = new OrchestratorServiceImpl(
      createStubComponents(),
      new InMemoryAgentRegistry(),
      new InMemoryTaskStore(),
    );

    await service.executeCreateTask(
      { intent: { kind: "plan", description: "x" } },
      {
        streamManager: stream,
        memoryPersistenceManager: createDefaultMemoryPersistenceManager(
          undefined,
          stream,
        ),
      },
    );

    expect(received).toContain("failed");
  });
});
