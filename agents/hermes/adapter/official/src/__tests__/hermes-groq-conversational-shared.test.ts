import { describe, expect, it, vi } from "vitest";

import type { HermesRequest } from "../../../src/hermes-request";
import {
  buildConversationalSystemPrompt,
  buildDatetimeAwarenessInstruction,
  buildGroqMessages,
  formatConversationalDateTime,
} from "../hermes-groq-conversational-shared";

const fixedNow = new Date("2026-05-30T14:30:00.000Z");

function minimalRequest(description: string): HermesRequest {
  return {
    requestId: "test-req-id",
    taskId: "test-task-id",
    userId: "test-user-id",
    intent: { kind: "chat", description },
    conversationTurns: [],
  };
}

describe("hermes-groq-conversational-shared", () => {
  it("formats localized datetime for Asia/Karachi by default", () => {
    const formatted = formatConversationalDateTime({}, fixedNow);
    expect(formatted).toMatch(/5\/30\/2026/);
    expect(formatted.length).toBeGreaterThan(8);
  });

  it("respects JARVIS_USER_TIMEZONE when set", () => {
    const formatted = formatConversationalDateTime(
      { JARVIS_USER_TIMEZONE: "UTC" },
      fixedNow,
    );
    expect(formatted).toContain("2026");
  });

  it("injects datetime and immediate time-response rule in system prompt", () => {
    const prompt = buildConversationalSystemPrompt({}, fixedNow);
    expect(prompt).toContain("Haseeb Rasheed");
    expect(prompt).toContain("JARVIS OS");
    expect(prompt).toContain("multi-agent orchestrator");
    expect(prompt).toContain("mai sub agent nahi banasakta");
    expect(prompt).toContain("CRITICAL IDENTITY RULE");
    expect(prompt).toContain("Current date and time:");
    expect(prompt).toContain(
      "respond IMMEDIATELY in chat without calling any external search-skill or windows_automation script",
    );
    expect(prompt).toContain(formatConversationalDateTime({}, fixedNow));
    expect(prompt).not.toContain("Reply naturally in 1-3 sentences");
  });

  it("refreshes datetime awareness on every Groq message packaging step", () => {
    vi.setSystemTime(fixedNow);
    const systemPrompt = buildConversationalSystemPrompt({}, fixedNow);
    const messages = buildGroqMessages(
      minimalRequest("time kia horaha hai"),
      systemPrompt,
      {},
    );
    const systemContent = messages[0]?.content ?? "";
    const instruction = buildDatetimeAwarenessInstruction({}, fixedNow);
    expect(systemContent).toContain(instruction);
    expect(messages.at(-1)?.content).toBe("time kia horaha hai");
    expect(messages.at(-1)?.role).toBe("user");
    vi.useRealTimers();
  });
});
