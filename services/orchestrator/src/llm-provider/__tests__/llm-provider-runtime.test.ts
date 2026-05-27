import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_OPENAI_LLM_PROVIDER_ID,
  DEFAULT_OLLAMA_LLM_PROVIDER_ID,
  DEFAULT_STUB_LLM_PROVIDER_ID,
} from "../llm-provider";
import { createDefaultLlmProviderRuntime } from "../create-default-llm-provider-runtime";

describe("LlmProviderRuntime", () => {
  const runtime = createDefaultLlmProviderRuntime();

  it("lists all default multi-provider connectors", () => {
    const providers = runtime.listProviders();
    expect(providers.map((entry) => entry.providerId)).toEqual([
      DEFAULT_STUB_LLM_PROVIDER_ID,
      DEFAULT_OPENAI_LLM_PROVIDER_ID,
      "gemini",
      "groq",
      "openrouter",
      DEFAULT_OLLAMA_LLM_PROVIDER_ID,
      "deepseek",
      "minimax",
    ]);
  });

  it("validateProvider succeeds for stub provider", async () => {
    const validation = await runtime.validateProvider(DEFAULT_STUB_LLM_PROVIDER_ID);
    expect(validation.valid).toBe(true);
    expect(validation.stub).toBe(true);
  });

  it("executePrompt returns deterministic stub content", async () => {
    const response = await runtime.executePrompt({
      providerId: DEFAULT_STUB_LLM_PROVIDER_ID,
      prompt: "Plan dashboard export",
    });

    expect(response.success).toBe(true);
    expect(response.stub).toBe(true);
    expect(response.content).toContain("Plan dashboard export");
  });

  it("OpenAI falls back to stub without API key", async () => {
    const original = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.JARVIS_OPENAI_API_KEY;

    const response = await runtime.executePrompt({
      providerId: DEFAULT_OPENAI_LLM_PROVIDER_ID,
      prompt: "Summarize task",
    });

    expect(response.stub).toBe(true);
    expect(response.content).toContain("Summarize task");

    if (original) {
      process.env.OPENAI_API_KEY = original;
    }
  });

  it("streamResponse emits chunks for stub provider", async () => {
    const chunks: string[] = [];
    const response = await runtime.streamResponse(
      {
        providerId: DEFAULT_STUB_LLM_PROVIDER_ID,
        prompt: "Stream planning context",
      },
      {
        subscriberId: "sub-1",
        onChunk: (chunk) => {
          chunks.push(chunk);
        },
      },
    );

    expect(response.streamed).toBe(true);
    expect(chunks.length).toBeGreaterThan(0);
  });

  it("executePrompt falls back to stub for unknown provider id", async () => {
    const response = await runtime.executePrompt({
      providerId: "unknown-provider",
      prompt: "Unknown provider path",
    });

    expect(response.providerId).toBe(DEFAULT_STUB_LLM_PROVIDER_ID);
    expect(response.stub).toBe(true);
  });

  it("Ollama validateProvider returns stub fallback when unreachable", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new Error("connection refused"),
    );

    const validation = await runtime.validateProvider(DEFAULT_OLLAMA_LLM_PROVIDER_ID);
    expect(validation.valid).toBe(false);
    expect(validation.stub).toBe(true);

    fetchMock.mockRestore();
  });
});
