import { describe, expect, it } from "vitest";

import { resolveAssistantReplyFromTaskOutput } from "../resolve-assistant-reply";

describe("resolveAssistantReplyFromTaskOutput", () => {
  it("prefers conversationalReply from Hermes payload", () => {
    const reply = resolveAssistantReplyFromTaskOutput({
      assistantReply: "1. Plan step one\n2. Plan step two",
      agentPayload: {
        conversationalReply: "Hello! How can I help you today?",
      },
    });
    expect(reply).toBe("Hello! How can I help you today?");
  });

  it("rejects numbered plan from assistantReply when no conversational text", () => {
    const reply = resolveAssistantReplyFromTaskOutput({
      assistantReply: "1. Activate protocol\n2. Retrieve user name",
      llmProvider: { success: true, contentPreview: "Complete." },
    });
    expect(reply).toBe("Complete.");
  });

  it("uses plan summary for default chat intents", () => {
    const reply = resolveAssistantReplyFromTaskOutput({
      agentPayload: {
        plan: {
          intentKind: "default",
          summary: "Hi Haseeb! What would you like to do next?",
        },
      },
    });
    expect(reply).toBe("Hi Haseeb! What would you like to do next?");
  });
});
