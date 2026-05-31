import { describe, expect, it, vi } from "vitest";

import { createDefaultProviderValidationRuntime } from "../index";
import { DEFAULT_STUB_LLM_PROVIDER_ID } from "../../llm-provider";

describe("Phase 89 provider streaming", () => {
  const runtime = createDefaultProviderValidationRuntime();

  it("streamResponse uses SSE path for OpenAI-compatible providers", async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.JARVIS_OPENAI_API_KEY;

    const sseBody = [
      'data: {"choices":[{"delta":{"content":"Live"}}]}\n',
      'data: {"choices":[{"delta":{"content":" stream"}}]}\n',
      "data: [DONE]\n",
    ].join("");

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(
      async (input: RequestInfo | URL) => {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url;
        if (url.includes("/chat/completions")) {
          return new Response(
            new ReadableStream({
              start(controller) {
                controller.enqueue(new TextEncoder().encode(sseBody));
                controller.close();
              },
            }),
            { status: 200 },
          );
        }
        return globalThis.fetch(input);
      },
    );

    try {
      const chunks: string[] = [];
      const response = await runtime.streamResponse(
        {
          providerId: "openai",
          prompt: "Stream test",
          providerApiKey: "sk-test-key-12345678",
        },
        {
          subscriberId: "phase-89",
          onChunk: (chunk) => chunks.push(chunk),
        },
      );

      expect(response.streamed).toBe(true);
      expect(response.stub).toBe(false);
      expect(chunks.join("")).toBe("Live stream");
      expect(response.latencyMs).toBeTypeOf("number");
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("returns fail-closed stub stream when provider key missing", async () => {
    delete process.env.GROQ_API_KEY;
    delete process.env.JARVIS_GROQ_API_KEY;

    const chunks: string[] = [];
    const response = await runtime.streamResponse(
      {
        providerId: "groq",
        prompt: "Fallback stream",
        providerApiKey: undefined,
      },
      {
        subscriberId: "phase-89-stub",
        onChunk: (chunk) => chunks.push(chunk),
      },
    );

    expect(response.stub).toBe(true);
    expect(response.success).toBe(false);
    expect(response.error?.code).toBe("PROVIDER_KEY_MISSING");
    expect(chunks.length).toBe(0);
  });

  it("stub provider still streams for safety", async () => {
    const chunks: string[] = [];
    const response = await runtime.streamResponse(
      {
        providerId: DEFAULT_STUB_LLM_PROVIDER_ID,
        prompt: "Stub safety",
      },
      {
        subscriberId: "phase-89-stub-provider",
        onChunk: (chunk) => chunks.push(chunk),
      },
    );

    expect(response.streamed).toBe(true);
    expect(response.stub).toBe(true);
    expect(chunks.length).toBeGreaterThan(0);
  });
});
