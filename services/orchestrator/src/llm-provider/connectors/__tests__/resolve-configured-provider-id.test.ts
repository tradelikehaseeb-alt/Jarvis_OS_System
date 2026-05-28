import { describe, expect, it } from "vitest";

import {
  LIVE_PROVIDER_RESOLUTION_ORDER,
  resolveFirstConfiguredProviderId,
} from "../resolve-configured-provider-id";

describe("resolveFirstConfiguredProviderId", () => {
  it("returns first provider with configured API key in priority order", () => {
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.MINIMAX_API_KEY;

    process.env.GROQ_API_KEY = "test-groq-key";

    expect(resolveFirstConfiguredProviderId()).toBe("groq");

    delete process.env.GROQ_API_KEY;
  });

  it("includes DeepSeek and Minimax in resolution order", () => {
    const ids = LIVE_PROVIDER_RESOLUTION_ORDER.map((entry) => entry.providerId);
    expect(ids).toContain("deepseek");
    expect(ids).toContain("minimax");
  });
});
