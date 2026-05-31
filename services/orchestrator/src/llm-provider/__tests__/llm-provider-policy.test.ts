import { afterEach, describe, expect, it } from "vitest";

import {
  allowLlmStubFallback,
  hasAnyPrimaryLlmApiKey,
  NO_LLM_API_KEYS_MESSAGE,
  resolveDefaultLiveLlmProviderId,
  resolvePrimaryLlmProviderId,
} from "../llm-provider-policy";

describe("llm-provider-policy", () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it("disables stub fallback in production by default", () => {
    process.env.NODE_ENV = "production";
    delete process.env.JARVIS_ALLOW_LLM_STUB_FALLBACK;
    expect(allowLlmStubFallback()).toBe(false);
  });

  it("enables stub fallback in NODE_ENV=test", () => {
    process.env.NODE_ENV = "test";
    expect(allowLlmStubFallback()).toBe(true);
  });

  it("resolves Groq first when GROQ_API_KEY is set", () => {
    process.env.GROQ_API_KEY = "gsk_test";
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    expect(resolvePrimaryLlmProviderId()).toBe("groq");
    expect(resolveDefaultLiveLlmProviderId()).toBe("groq");

    delete process.env.GROQ_API_KEY;
  });

  it("falls back to OpenAI then Gemini in chain", () => {
    delete process.env.GROQ_API_KEY;
    process.env.OPENAI_API_KEY = "sk-test";
    delete process.env.GEMINI_API_KEY;

    expect(resolvePrimaryLlmProviderId()).toBe("openai");

    delete process.env.OPENAI_API_KEY;
    process.env.GEMINI_API_KEY = "gem-test";
    expect(resolvePrimaryLlmProviderId()).toBe("gemini");

    delete process.env.GEMINI_API_KEY;
  });

  it("reports no primary keys message when unset and stub disabled", () => {
    process.env.NODE_ENV = "production";
    process.env.JARVIS_ALLOW_LLM_STUB_FALLBACK = "false";
    delete process.env.GROQ_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    expect(hasAnyPrimaryLlmApiKey()).toBe(false);
    expect(resolveDefaultLiveLlmProviderId()).toBe("groq");
    expect(NO_LLM_API_KEYS_MESSAGE).toContain("GROQ_API_KEY");
  });
});
