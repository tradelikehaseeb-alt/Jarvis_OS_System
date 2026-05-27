import { describe, expect, it } from "vitest";

import {
  InMemoryMemoryStore,
  MemoryPersistenceManager,
  createDefaultMemoryPersistenceManager,
} from "../index";

describe("InMemoryMemoryStore", () => {
  it("saves and retrieves records", () => {
    const store = new InMemoryMemoryStore();
    const record = store.saveRecord({
      recordId: "mem-1",
      type: "conversation",
      userId: "user-1",
      timestamp: "2026-01-01T00:00:00.000Z",
      content: { message: "hello" },
    });

    expect(store.getRecord(record.recordId)?.content.message).toBe("hello");
  });

  it("queries history with filters and limit", () => {
    const store = new InMemoryMemoryStore();
    store.saveRecord({
      recordId: "mem-a",
      type: "activity",
      userId: "user-1",
      timestamp: "2026-01-01T00:00:01.000Z",
      taskId: "task-1",
      content: { kind: "planning_started" },
    });
    store.saveRecord({
      recordId: "mem-b",
      type: "execution",
      userId: "user-1",
      timestamp: "2026-01-01T00:00:02.000Z",
      taskId: "task-1",
      content: { state: "completed" },
    });
    store.saveRecord({
      recordId: "mem-c",
      type: "activity",
      userId: "user-2",
      timestamp: "2026-01-01T00:00:03.000Z",
      content: {},
    });

    const activityOnly = store.queryHistory({
      userId: "user-1",
      types: ["activity"],
    });
    expect(activityOnly).toHaveLength(1);

    const limited = store.queryHistory({
      userId: "user-1",
      limit: 1,
    });
    expect(limited).toHaveLength(1);
    expect(limited[0]?.recordId).toBe("mem-b");
  });
});

describe("MemoryPersistenceManager", () => {
  it("persists conversation turns with incrementing turn index", () => {
    const manager = createDefaultMemoryPersistenceManager();

    manager.persistConversationTurn({
      conversationId: "conv-1",
      userId: "user-1",
      role: "user",
      message: "Plan my week",
    });
    const assistant = manager.persistConversationTurn({
      conversationId: "conv-1",
      userId: "user-1",
      role: "assistant",
      message: "Here is your plan",
    });

    expect(assistant.content.turnIndex).toBe(2);
    expect(
      manager.queryHistory({
        userId: "user-1",
        types: ["conversation"],
      }),
    ).toHaveLength(2);
  });

  it("generates deterministic summary from stored history", () => {
    const manager = createDefaultMemoryPersistenceManager();

    manager.persistConversationTurn({
      conversationId: "conv-1",
      userId: "user-1",
      role: "user",
      message: "Automate dashboard",
      taskId: "task-1",
    });
    manager.saveRecord({
      recordId: "exec-1",
      type: "execution",
      userId: "user-1",
      timestamp: new Date().toISOString(),
      taskId: "task-1",
      content: { state: "completed" },
    });

    const summary = manager.generateSummary({
      userId: "user-1",
      taskId: "task-1",
      conversationId: "conv-1",
    });

    expect(summary.text).toContain("user-1");
    expect(summary.taskCount).toBe(1);
    expect(
      manager.queryHistory({ userId: "user-1", types: ["summary"] }),
    ).toHaveLength(1);
  });

  it("returns recent activity records", () => {
    const manager = new MemoryPersistenceManager();
    manager.saveRecord({
      recordId: "act-1",
      type: "activity",
      userId: "user-1",
      timestamp: "2026-01-01T00:00:01.000Z",
      content: { kind: "plan_generated" },
    });
    manager.saveRecord({
      recordId: "act-2",
      type: "activity",
      userId: "user-1",
      timestamp: "2026-01-01T00:00:02.000Z",
      content: { kind: "execution_completed" },
    });

    const recent = manager.getRecentActivity("user-1", 1);
    expect(recent).toHaveLength(1);
    expect(recent[0]?.recordId).toBe("act-2");
  });
});
