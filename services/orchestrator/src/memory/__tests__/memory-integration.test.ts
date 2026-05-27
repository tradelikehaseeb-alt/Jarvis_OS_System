import { describe, expect, it } from "vitest";

import {
  createDefaultMemoryPersistenceManager,
  createTestOrchestratorService,
} from "../../index";

describe("memory persistence integration", () => {
  it("stores execution lifecycle events and conversation turns during task execution", async () => {
    const memory = createDefaultMemoryPersistenceManager();
    const service = await createTestOrchestratorService();

    const { record } = await service.executeCreateTask(
      {
        intent: { kind: "plan", description: "Plan sprint goals" },
        metadata: { conversationId: "conv-integration-1" },
      },
      { memoryPersistenceManager: memory },
    );

    expect(record.createTaskResponse.status).toBe("completed");

    const memoryOutput = record.taskStatus.output?.memory as {
      summary: string;
      conversationId: string;
      historyCount: number;
    };

    expect(memoryOutput.conversationId).toBe("conv-integration-1");
    expect(memoryOutput.summary).toContain("user-api-stub");
    expect(memoryOutput.historyCount).toBeGreaterThan(0);

    const conversation = memory.queryHistory({
      userId: "user-api-stub",
      types: ["conversation"],
      conversationId: "conv-integration-1",
    });
    expect(conversation.some((r) => r.content.role === "user")).toBe(true);
    expect(conversation.some((r) => r.content.role === "assistant")).toBe(true);

    const execution = memory.queryHistory({
      userId: "user-api-stub",
      types: ["execution"],
      taskId: record.createTaskResponse.taskId,
    });
    expect(execution.length).toBeGreaterThan(0);
    expect(execution[0]?.content.state).toBe("completed");

    const activity = memory.getRecentActivity("user-api-stub", 10);
    expect(activity.length).toBeGreaterThan(0);
  });

  it("retains history across multiple tasks for the same user", async () => {
    const memory = createDefaultMemoryPersistenceManager();
    const service = await createTestOrchestratorService();

    await service.executeCreateTask(
      { intent: { kind: "research", description: "Find docs" } },
      { memoryPersistenceManager: memory },
    );
    await service.executeCreateTask(
      { intent: { kind: "plan", description: "Plan week" } },
      { memoryPersistenceManager: memory },
    );

    const history = memory.queryHistory({ userId: "user-api-stub" });
    expect(history.length).toBeGreaterThan(4);

    const summary = memory.generateSummary({ userId: "user-api-stub" });
    expect(summary.taskCount).toBeGreaterThanOrEqual(2);
  });
});
