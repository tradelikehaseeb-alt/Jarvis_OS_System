import { describe, expect, it } from "vitest";

import { createDefaultLocalMemoryRuntime } from "@jarvis/local-memory";

import { ConversationContinuityRuntime } from "../conversation-continuity-runtime";

describe("ConversationContinuityRuntime", () => {
  it("updates session profile after registering a turn", () => {
    const runtime = createDefaultLocalMemoryRuntime({ useFileBackend: false });
    const continuity = new ConversationContinuityRuntime(runtime);

    const profile = continuity.registerTurn({
      userId: "user-1",
      conversationId: "conv-1",
      taskId: "task-1",
      message: "Plan dashboard rollout for next sprint",
    });

    expect(profile.recentInteractionIds).toContain("task-1");
    expect(profile.topicKeywords.length).toBeGreaterThan(0);

    const loaded = continuity.getProfile("user-1", "conv-1");
    expect(loaded?.recentInteractionIds).toContain("task-1");
  });

  it("tracks linked conversations for multi-session continuity", () => {
    const continuity = new ConversationContinuityRuntime();
    continuity.registerTurn({
      userId: "user-1",
      conversationId: "conv-2",
      message: "Follow up on rollout",
      priorConversationIds: ["conv-1"],
    });

    expect(continuity.getLinkedConversations("conv-2")).toEqual(["conv-1"]);
  });
});
