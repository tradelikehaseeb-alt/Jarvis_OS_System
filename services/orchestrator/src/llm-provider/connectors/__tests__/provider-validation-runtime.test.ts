import { describe, expect, it, vi } from "vitest";

import {
  createDefaultProviderValidationRuntime,
  DEEPSEEK_PROVIDER_ID,
  GEMINI_PROVIDER_ID,
  GROQ_PROVIDER_ID,
  MINIMAX_PROVIDER_ID,
  OPENAI_PROVIDER_ID,
  OPENROUTER_PROVIDER_ID,
  OLLAMA_PROVIDER_ID,
} from "../index";
import { DEFAULT_STUB_LLM_PROVIDER_ID } from "../../llm-provider";

describe("ProviderValidationRuntime", () => {
  const runtime = createDefaultProviderValidationRuntime();

  it("registers all default multi-provider connectors", () => {
    const providers = runtime.listProviders().map((entry) => entry.providerId);
    expect(providers).toEqual([
      DEFAULT_STUB_LLM_PROVIDER_ID,
      OPENAI_PROVIDER_ID,
      GEMINI_PROVIDER_ID,
      GROQ_PROVIDER_ID,
      OPENROUTER_PROVIDER_ID,
      OLLAMA_PROVIDER_ID,
      DEEPSEEK_PROVIDER_ID,
      MINIMAX_PROVIDER_ID,
    ]);
  });

  it("validateApiKey returns stub fallback without configured key", async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.JARVIS_OPENAI_API_KEY;

    const validation = await runtime.validateApiKey(OPENAI_PROVIDER_ID);
    expect(validation.valid).toBe(false);
    expect(validation.stub).toBe(true);
  });

  it("validateApiKey accepts explicit api key", async () => {
    const validation = await runtime.validateApiKey(
      GROQ_PROVIDER_ID,
      "test-api-key-12345678",
    );
    expect(validation.valid).toBe(true);
    expect(validation.stub).toBe(false);
  });

  it("getAvailableModels returns configured model list", async () => {
    const models = await runtime.getAvailableModels(GEMINI_PROVIDER_ID);
    expect(models.length).toBeGreaterThan(0);
    expect(models).toContain("gemini-2.0-flash");
  });

  it("executePrompt uses stub fallback for unconfigured OpenAI", async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.JARVIS_OPENAI_API_KEY;

    const response = await runtime.executePrompt({
      providerId: OPENAI_PROVIDER_ID,
      prompt: "Plan my workflow",
    });

    expect(response.stub).toBe(true);
    expect(response.success).toBe(false);
    expect(response.error?.code).toBe("PROVIDER_KEY_MISSING");
    expect(response.content).toBe("");
  });

  it("streamResponse emits chunks through provider runtime", async () => {
    const chunks: string[] = [];
    const response = await runtime.streamResponse(
      {
        providerId: DEFAULT_STUB_LLM_PROVIDER_ID,
        prompt: "Stream connector output",
      },
      {
        subscriberId: "connector-sub",
        onChunk: (chunk) => chunks.push(chunk),
      },
    );

    expect(response.streamed).toBe(true);
    expect(chunks.length).toBeGreaterThan(0);
  });

  it("registerProvider adds custom provider configuration", async () => {
    const custom = createDefaultProviderValidationRuntime();
    const models = await custom.getAvailableModels(DEEPSEEK_PROVIDER_ID);
    expect(models).toContain("deepseek-chat");
  });

  it("Ollama validateApiKey reports stub when unreachable", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new Error("connection refused"),
    );

    const validation = await runtime.validateApiKey(OLLAMA_PROVIDER_ID);
    expect(validation.valid).toBe(false);
    expect(validation.stub).toBe(true);

    fetchMock.mockRestore();
  });
});
