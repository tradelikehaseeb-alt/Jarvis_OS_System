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
  });
});
