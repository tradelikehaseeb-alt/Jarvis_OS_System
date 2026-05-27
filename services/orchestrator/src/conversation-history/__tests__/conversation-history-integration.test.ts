import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { createDefaultLocalMemoryRuntime } from "@jarvis/local-memory";

import { createTestTempDir } from "../../memory/__tests__/test-temp-dir";
import { createDefaultConversationHistoryRuntime } from "../create-default-conversation-history-runtime";

describe("conversation history integration", () => {
  it("persists conversation history to local memory file and reloads after restart", () => {
    const dir = createTestTempDir("jarvis-conversation-history-");
    const filePath = join(dir, "local-memory.json");

    const runtime = createDefaultConversationHistoryRuntime({ filePath });
    runtime.saveConversation({
      conversationId: "conv-persist-1",
      userId: "user-api-stub",
      role: "user",
      message: "Plan sprint",
      taskId: "task-1",
    });
    runtime.saveConversation({
      conversationId: "conv-persist-1",
      userId: "user-api-stub",
      role: "assistant",
      message: "Here is the plan",
      taskId: "task-1",
    });

    const reloaded = createDefaultConversationHistoryRuntime({
      localMemoryRuntime: createDefaultLocalMemoryRuntime({ filePath }),
    });

    const conversation = reloaded.getConversation("conv-persist-1", "user-api-stub");
    expect(conversation?.turnCount).toBe(2);
    expect(conversation?.turns.some((t) => t.role === "assistant")).toBe(true);

    const result = reloaded.queryConversationHistory({
      userId: "user-api-stub",
      conversationId: "conv-persist-1",
    });
    expect(result.totalTurns).toBe(2);
    expect(reloaded.getRecentHistory("user-api-stub", 5)).toHaveLength(1);
  });

  it("uses in-memory fallback when file backend disabled", () => {
    const runtime = createDefaultConversationHistoryRuntime({
      useFileBackend: false,
    });

    runtime.saveConversation({
      conversationId: "conv-mem-1",
      userId: "user-1",
      role: "user",
      message: "Hello",
    });

    expect(runtime.getConversation("conv-mem-1", "user-1")?.turnCount).toBe(1);
  });
});
