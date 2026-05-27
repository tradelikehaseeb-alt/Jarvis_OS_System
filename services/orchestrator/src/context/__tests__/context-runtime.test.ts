import { describe, expect, it } from "vitest";

import { createDefaultConversationHistoryRuntime } from "../../conversation-history";
import {
  createDefaultContextRuntime,
  DefaultContextBuilder,
} from "../index";

describe("DefaultContextRuntime", () => {
  it("builds fallback context when no conversation history exists", () => {
    const runtime = createDefaultContextRuntime({
      builder: new DefaultContextBuilder(),
    });

    const context = runtime.buildContext({
      userId: "user-1",
      conversationId: "conv-1",
      intentDescription: "Plan sprint",
    });

    expect(context.source).toBe("fallback");
    expect(context.turns).toHaveLength(0);
    expect(context.summary).toContain("No prior conversation context");
  });

  it("getRecentContext and getRelevantContext return conversation turns", () => {
    const conversationHistory = createDefaultConversationHistoryRuntime({
      useFileBackend: false,
    });
    conversationHistory.saveConversation({
      conversationId: "conv-1",
      userId: "user-1",
      role: "user",
      message: "Plan sprint goals",
    });
    conversationHistory.saveConversation({
      conversationId: "conv-1",
      userId: "user-1",
      role: "assistant",
      message: "Here is the sprint plan",
    });

    const runtime = createDefaultContextRuntime({ conversationHistory });
    const recent = runtime.getRecentContext({
      userId: "user-1",
      conversationId: "conv-1",
    });
    const relevant = runtime.getRelevantContext({
      userId: "user-1",
      conversationId: "conv-1",
      intentDescription: "sprint plan",
    });

    expect(recent.source).toBe("conversation-history");
    expect(recent.turns).toHaveLength(2);
    expect(relevant.turns.some((turn) => turn.message.includes("sprint"))).toBe(
      true,
    );
  });
});
