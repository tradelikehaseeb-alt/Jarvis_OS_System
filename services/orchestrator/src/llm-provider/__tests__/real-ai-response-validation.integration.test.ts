import { afterAll, describe, expect, it } from "vitest";

import { REAL_AI_RESPONSE_PROMPTS } from "@jarvis/types";

import { createDefaultLiveProviderRuntime } from "../../live-provider";
import { createDefaultProviderHealthValidationRuntime } from "../provider-health";
import { DEFAULT_API_USER_ID } from "../../task-execution";
import {
  createDefaultProviderSettingsRuntime,
  DEEPSEEK_PROVIDER_ID,
  GEMINI_PROVIDER_ID,
  GROQ_PROVIDER_ID,
  MINIMAX_PROVIDER_ID,
  OLLAMA_PROVIDER_ID,
  OPENAI_PROVIDER_ID,
  OPENROUTER_PROVIDER_ID,
} from "../connectors";

const PROVIDER_PRIORITY = [
  OLLAMA_PROVIDER_ID,
  OPENROUTER_PROVIDER_ID,
  GEMINI_PROVIDER_ID,
  GROQ_PROVIDER_ID,
  OPENAI_PROVIDER_ID,
  DEEPSEEK_PROVIDER_ID,
  MINIMAX_PROVIDER_ID,
] as const;

function estimateTokens(content: string): number {
  return Math.ceil(content.length / 4);
}

async function resolveLiveProviderId(): Promise<{
  providerId: string;
  connected: boolean;
  stub: boolean;
  message: string;
  availableModels: readonly string[];
  probeLatencyMs: number;
} | null> {
  const healthRuntime = createDefaultProviderHealthValidationRuntime();

  for (const providerId of PROVIDER_PRIORITY) {
    const health = await healthRuntime.validateProviderHealth(
      providerId,
      DEFAULT_API_USER_ID,
    );

    if (health.connected && !health.stub) {
      return {
        providerId,
        connected: health.connected,
        stub: health.stub,
        message: health.message,
        availableModels: health.availableModels,
        probeLatencyMs: health.latencyMs,
      };
    }
  }

  return null;
}

describe("Phase 88 real AI response validation", () => {
  const settingsRuntime = createDefaultProviderSettingsRuntime();
  let liveProviderId: string | undefined;
  let usingRealProvider = false;

  afterAll(() => {
    if (liveProviderId) {
      console.log(
        JSON.stringify({
          phase: 88,
          providerSelected: liveProviderId,
          realInference: usingRealProvider,
        }),
      );
    }
  });

  it("detects configured live provider in priority order", async () => {
    const live = await resolveLiveProviderId();

    if (live) {
      liveProviderId = live.providerId;
      usingRealProvider = true;
      expect(live.connected).toBe(true);
      expect(live.stub).toBe(false);
      expect(live.availableModels.length).toBeGreaterThan(0);
      console.log("LIVE_PROVIDER:", JSON.stringify(live));
      return;
    }

    liveProviderId = OLLAMA_PROVIDER_ID;
    usingRealProvider = false;

    const ollamaHealth = await createDefaultProviderHealthValidationRuntime().validateProviderHealth(
      OLLAMA_PROVIDER_ID,
      DEFAULT_API_USER_ID,
    );

    expect(ollamaHealth.stub).toBe(true);
    expect(ollamaHealth.failureHandled).toBe(true);
    console.log("NO_LIVE_PROVIDER:", ollamaHealth.message);
  });

  it("validates API key save/load and provider status", async () => {
    const testKey = "phase-88-test-key-12345678";
    const providerId = liveProviderId ?? GROQ_PROVIDER_ID;

    settingsRuntime.selectProvider(DEFAULT_API_USER_ID, providerId);

    if (providerId !== OLLAMA_PROVIDER_ID) {
      const saveResult = await settingsRuntime.saveApiKey(
        DEFAULT_API_USER_ID,
        providerId,
        testKey,
      );

      expect(saveResult.providerId).toBe(providerId);

      const reloaded = settingsRuntime.getSettings(DEFAULT_API_USER_ID);
      expect(reloaded.selectedProviderId).toBe(providerId);

      const status = await settingsRuntime.getProviderStatus(
        DEFAULT_API_USER_ID,
        providerId,
      );
      expect(status.providerId).toBe(providerId);
      expect(status.availableModels.length).toBeGreaterThan(0);

      console.log(
        "API_KEY_SAVE:",
        JSON.stringify({
          providerId,
          valid: saveResult.valid,
          stub: saveResult.stub,
          configured: status.configured,
        }),
      );
    } else {
      const status = await settingsRuntime.getProviderStatus(
        DEFAULT_API_USER_ID,
        OLLAMA_PROVIDER_ID,
      );
      expect(status.providerId).toBe(OLLAMA_PROVIDER_ID);
      console.log("OLLAMA_STATUS:", JSON.stringify(status));
    }
  });

  it("validates streaming response path", async () => {
    const providerId = liveProviderId ?? GROQ_PROVIDER_ID;
    const chunks: string[] = [];

    const streamResult = await settingsRuntime.streamResponse(
      {
        providerId,
        prompt: "Reply with one word: hello",
        userId: DEFAULT_API_USER_ID,
      },
      {
        subscriberId: "phase-88-stream",
        onChunk: (chunk) => chunks.push(chunk),
      },
    );

    expect(streamResult.streamed).toBe(true);
    expect(chunks.length).toBeGreaterThan(0);

    console.log(
      "STREAMING:",
      JSON.stringify({
        providerId,
        stub: streamResult.stub,
        chunkCount: chunks.length,
        contentLength: streamResult.content.length,
      }),
    );
  });

  it("handles provider failure with stub fallback", async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.JARVIS_OPENAI_API_KEY;

    const response = await settingsRuntime.executePrompt({
      providerId: OPENAI_PROVIDER_ID,
      prompt: "failure handling probe",
      userId: DEFAULT_API_USER_ID,
    });

    expect(response.stub).toBe(true);
    expect(response.content.length).toBeGreaterThan(0);

    console.log(
      "FAILURE_HANDLING:",
      JSON.stringify({
        providerId: OPENAI_PROVIDER_ID,
        stub: response.stub,
        success: response.success,
      }),
    );
  });

  it.each(REAL_AI_RESPONSE_PROMPTS)(
    "executes Phase 88 prompt: %s",
    async (prompt) => {
      const runtime = await createDefaultLiveProviderRuntime({
        providerId: liveProviderId,
      });

      const startedAt = Date.now();
      const result = await runtime.executeLivePrompt({
        prompt,
        userId: DEFAULT_API_USER_ID,
        providerId: liveProviderId,
      });
      const latencyMs = Date.now() - startedAt;

      const llmOutput = result.liveResult.flowResult.record.taskStatus.output
        ?.llmProvider as { content?: string; stub?: boolean } | undefined;

      const content = llmOutput?.content ?? "";
      const estimatedTokens = estimateTokens(content);

      console.log(
        "PROMPT_RESULT:",
        JSON.stringify({
          prompt,
          providerId: result.providerId,
          stub: result.stub,
          success: result.success,
          latencyMs,
          estimatedTokens,
          contentPreview: content.slice(0, 120),
          hermesPlanCreated: result.hermesPlanCreated,
          openClawTriggered: result.openClawTriggered,
          retries: 0,
          errors: result.success ? [] : ["execution_failed"],
        }),
      );

      expect(result.success).toBe(true);
      expect(result.hermesPlanCreated).toBe(true);
      expect(result.openClawTriggered).toBe(true);

      if (usingRealProvider) {
        expect(result.stub).toBe(false);
        expect(content.length).toBeGreaterThan(20);
      } else {
        expect(result.stub).toBe(true);
        expect(latencyMs).toBeLessThan(5000);
      }
    },
  );
});
