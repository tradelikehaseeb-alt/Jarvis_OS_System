import { describe, expect, it } from "vitest";

import {
  InMemorySpeechConversationManager,
  createDefaultSpeechConversationManager,
} from "../conversation";

describe("speech conversation manager", () => {
  it("creates deterministic active conversation with context", () => {
    const manager = new InMemorySpeechConversationManager();
    const conversation = manager.createConversation("conv-1", {
      locale: "en",
      domain: "trading",
      metadata: { source: "voice-ui" },
    });

    expect(conversation).toMatchObject({
      conversationId: "conv-1",
      state: "active",
      createdAt: new Date(0).toISOString(),
      context: {
        locale: "en",
        domain: "trading",
        metadata: { source: "voice-ui" },
      },
    });
  });

  it("appends user and assistant turns", () => {
    const manager = new InMemorySpeechConversationManager();
    manager.createConversation("conv-2");
    manager.appendUserTurn("conv-2", "open gold chart");
    const updated = manager.appendAssistantTurn("conv-2", "opening gold chart");

    expect(updated.turns).toHaveLength(2);
    expect(updated.turns[0]).toMatchObject({
      turnId: "speech-turn-1",
      role: "user",
      text: "open gold chart",
    });
    expect(updated.turns[1]).toMatchObject({
      turnId: "speech-turn-2",
      role: "assistant",
      text: "opening gold chart",
    });
  });

  it("interrupts, resumes, and completes conversation", () => {
    const manager = new InMemorySpeechConversationManager();
    manager.createConversation("conv-3");

    const interrupted = manager.interruptConversation("conv-3", "user barge-in");
    expect(interrupted.state).toBe("interrupted");
    expect(interrupted.interruptions[0]).toMatchObject({
      interruptionId: "speech-interruption-1",
      reason: "user barge-in",
    });

    const resumed = manager.resumeConversation("conv-3");
    expect(resumed.state).toBe("active");

    const ended = manager.endConversation("conv-3");
    expect(ended.state).toBe("completed");
    expect(ended.endedAt).toBe(new Date(0).toISOString());
  });

  it("supports getConversation and throws for unknown conversation", () => {
    const manager = new InMemorySpeechConversationManager();
    manager.createConversation("conv-4");
    expect(manager.getConversation("conv-4")?.conversationId).toBe("conv-4");
    expect(() => manager.appendUserTurn("missing", "hi")).toThrow(
      "Speech conversation not found: missing",
    );
  });

  it("creates default manager instance", () => {
    const manager = createDefaultSpeechConversationManager();
    const conversation = manager.createConversation();
    expect(conversation.conversationId.startsWith("speech-conversation-")).toBe(
      true,
    );
  });
});
