import { describe, expect, it } from "vitest";

import { createDefaultConversationHistoryRuntime } from "../create-default-conversation-history-runtime";

describe("DefaultConversationHistoryRuntime", () => {
  it("saves and retrieves a conversation by id", () => {
    const runtime = createDefaultConversationHistoryRuntime({
      useFileBackend: false,
    });

    runtime.saveConversation({
      conversationId: "conv-1",
      userId: "user-1",
      role: "user",
      message: "Hello",
    });
    runtime.saveConversation({
      conversationId: "conv-1",
      userId: "user-1",
      role: "assistant",
      message: "Hi there",
    });

    const conversation = runtime.getConversation("conv-1", "user-1");
    expect(conversation?.turnCount).toBe(2);
    expect(conversation?.turns[0]?.role).toBe("user");
    expect(conversation?.turns[1]?.message).toBe("Hi there");
  });

  it("queries conversation history with filters and limits", () => {
    const runtime = createDefaultConversationHistoryRuntime({
      useFileBackend: false,
    });

    runtime.saveConversation({
      conversationId: "conv-a",
      userId: "user-1",
      role: "user",
      message: "A",
    });
    runtime.saveConversation({
      conversationId: "conv-b",
      userId: "user-1",
      role: "user",
      message: "B",
      taskId: "task-1",
    });

    const all = runtime.queryConversationHistory({ userId: "user-1" });
    expect(all.histories.length).toBe(2);
    expect(all.totalTurns).toBe(2);

    const byTask = runtime.queryConversationHistory({
      userId: "user-1",
      taskId: "task-1",
    });
    expect(byTask.histories).toHaveLength(1);
    expect(byTask.histories[0]?.conversationId).toBe("conv-b");
  });

  it("returns recent history ordered by updatedAt", () => {
    const runtime = createDefaultConversationHistoryRuntime({
      useFileBackend: false,
    });

    runtime.saveConversation({
      conversationId: "conv-old",
      userId: "user-1",
      role: "user",
      message: "Old",
    });
    runtime.saveConversation({
      conversationId: "conv-new",
      userId: "user-1",
      role: "user",
      message: "New",
    });
    runtime.saveConversation({
      conversationId: "conv-new",
      userId: "user-1",
      role: "assistant",
      message: "Reply",
    });

    const recent = runtime.getRecentHistory("user-1", 1);
    expect(recent).toHaveLength(1);
    expect(recent[0]?.conversationId).toBe("conv-new");
    expect(recent[0]?.turnCount).toBe(2);
  });
});
