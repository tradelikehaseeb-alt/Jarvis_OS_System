import { describe, expect, it } from "vitest";

import { extractRecalledContextFromAgentContext } from "../extract-recalled-context";

describe("extractRecalledContextFromAgentContext", () => {
  it("extracts conversation-history snippets", () => {
    const context = extractRecalledContextFromAgentContext({
      contextRef: "ctx-1",
      userId: "user-1",
      metadata: {
        jarvisMemoryRecall: [
          {
            content: "Earlier dashboard rollout discussion",
            source: "conversation-history",
          },
          {
            content: "No prior context",
            source: "fallback",
          },
        ],
      },
    });

    expect(context?.count).toBe(1);
    expect(context?.snippets[0]).toContain("dashboard rollout");
    expect(context?.turns[0]?.message).toContain("dashboard rollout");
  });

  it("extracts structured conversation messages for Hermes multi-turn", () => {
    const context = extractRecalledContextFromAgentContext({
      contextRef: "ctx-2",
      userId: "user-1",
      metadata: {
        conversationMessages: [
          { role: "user", message: "mai lahore mai hu" },
          { role: "assistant", message: "Theek hai, aap Lahore mein hain." },
        ],
      },
    });

    expect(context?.count).toBe(2);
    expect(context?.turns[0]).toEqual({
      role: "user",
      message: "mai lahore mai hu",
    });
    expect(context?.turns[1]?.role).toBe("assistant");
  });
});
