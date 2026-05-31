import type { LlmProviderRequest } from "../llm-provider-request";
import type { LlmProviderResponse } from "../llm-provider-response";
import type { LlmStreamSubscriber } from "../llm-stream-subscriber";
import {
  DEFAULT_STUB_LLM_PROVIDER_ID,
  type LlmProvider,
  type LlmProviderValidation,
} from "../llm-provider";
import {
  allowLlmStubFallback,
  createFailClosedLlmResponse,
  NO_LLM_API_KEYS_MESSAGE,
} from "../llm-provider-policy";
import { buildStubLlmContent, createStubLlmResponse } from "../llm-provider-utils";

/**
 * Deterministic stub LLM — **only** when `allowLlmStubFallback()` is true
 * (`NODE_ENV=test` or `JARVIS_ALLOW_LLM_STUB_FALLBACK=true`).
 *
 * Production with fail-closed policy receives `LLM_STUB_DISABLED` instead of canned text.
 */
export class StubLlmProvider implements LlmProvider {
  readonly providerId = DEFAULT_STUB_LLM_PROVIDER_ID;
  readonly kind = "stub" as const;
  readonly label = "LLM Stub";

  private rejectWhenDisabled(
    request: LlmProviderRequest,
    streamed: boolean,
  ): LlmProviderResponse {
    return createFailClosedLlmResponse(
      request,
      this.providerId,
      this.kind,
      "LLM_STUB_DISABLED",
      [
        "LLM stub fallback is disabled.",
        "Set GROQ_API_KEY (recommended), OPENAI_API_KEY, or GEMINI_API_KEY in .env.",
        "For local tests only: JARVIS_ALLOW_LLM_STUB_FALLBACK=true or NODE_ENV=test.",
        NO_LLM_API_KEYS_MESSAGE,
      ].join(" "),
      { streamed, model: "stub-model" },
    );
  }

  async validateProvider(): Promise<LlmProviderValidation> {
    if (!allowLlmStubFallback()) {
      return {
        valid: false,
        providerId: this.providerId,
        kind: this.kind,
        stub: false,
        message: "LLM stub disabled — configure GROQ_API_KEY or enable test stub fallback",
      };
    }

    return {
      valid: true,
      providerId: this.providerId,
      kind: this.kind,
      stub: true,
      message: "Deterministic stub LLM provider ready (test / explicit fallback only)",
    };
  }

  async executePrompt(request: LlmProviderRequest): Promise<LlmProviderResponse> {
    if (!allowLlmStubFallback()) {
      return this.rejectWhenDisabled(request, false);
    }

    return createStubLlmResponse(request, this.kind, this.providerId);
  }

  async streamResponse(
    request: LlmProviderRequest,
    subscriber: LlmStreamSubscriber,
  ): Promise<LlmProviderResponse> {
    if (!allowLlmStubFallback()) {
      return this.rejectWhenDisabled(request, true);
    }

    const content = buildStubLlmContent(request, this.kind);
    for (const chunk of content.split(" ")) {
      subscriber.onChunk(`${chunk} `);
    }
    subscriber.onComplete?.({ content });
    return createStubLlmResponse(request, this.kind, this.providerId, {
      streamed: true,
    });
  }
}
