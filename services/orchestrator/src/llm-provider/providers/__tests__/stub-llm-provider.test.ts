import { afterEach, describe, expect, it } from "vitest";

import { StubLlmProvider } from "../stub-llm-provider";

describe("StubLlmProvider fail-closed policy", () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it("returns canned content when stub fallback is allowed (test mode)", async () => {
    process.env.NODE_ENV = "test";
    delete process.env.JARVIS_ALLOW_LLM_STUB_FALLBACK;

    const adapter = new StubLlmProvider();
    const response = await adapter.executePrompt({
      providerId: "llm-stub",
      prompt: "Plan release",
    });

    expect(response.success).toBe(true);
    expect(response.stub).toBe(true);
    expect(response.content).toContain("Plan release");
  });

  it("returns fail-closed error when stub fallback is disabled", async () => {
    process.env.NODE_ENV = "production";
    process.env.JARVIS_ALLOW_LLM_STUB_FALLBACK = "false";

    const adapter = new StubLlmProvider();
    const response = await adapter.executePrompt({
      providerId: "llm-stub",
      prompt: "Plan release",
    });

    expect(response.success).toBe(false);
    expect(response.stub).toBe(false);
    expect(response.content).toBe("");
    expect(response.error?.code).toBe("LLM_STUB_DISABLED");
    expect(response.error?.message).toContain("GROQ_API_KEY");
  });

  it("allows stub when JARVIS_ALLOW_LLM_STUB_FALLBACK=true explicitly", async () => {
    process.env.NODE_ENV = "production";
    process.env.JARVIS_ALLOW_LLM_STUB_FALLBACK = "true";

    const adapter = new StubLlmProvider();
    const response = await adapter.executePrompt({
      providerId: "llm-stub",
      prompt: "Hello",
    });

    expect(response.success).toBe(true);
    expect(response.stub).toBe(true);
  });
});
