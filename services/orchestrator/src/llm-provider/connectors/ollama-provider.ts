import type { LlmProviderRequest } from "../llm-provider-request";
import type { LlmProviderResponse } from "../llm-provider-response";
import type { LlmProvider, LlmProviderValidation } from "../llm-provider";
import type { LlmStreamSubscriber } from "../llm-stream-subscriber";
import {
  createStubLlmResponse,
  resolveOllamaBaseUrl,
  resolveOllamaModel,
} from "../llm-provider-utils";

import { OLLAMA_PROVIDER_CONFIGURATION } from "./default-provider-configurations";

interface OllamaChatResponse {
  readonly message?: { readonly content?: string };
}

/** Ollama local connector (Phase 82). */
export class OllamaProvider implements LlmProvider {
  readonly providerId = OLLAMA_PROVIDER_CONFIGURATION.providerId;
  readonly kind = OLLAMA_PROVIDER_CONFIGURATION.kind;
  readonly label = OLLAMA_PROVIDER_CONFIGURATION.label;

  async validateProvider(): Promise<LlmProviderValidation> {
    const baseUrl = resolveOllamaBaseUrl();

    try {
      const response = await fetch(`${baseUrl}/api/tags`, { method: "GET" });
      if (!response.ok) {
        return {
          valid: false,
          providerId: this.providerId,
          kind: this.kind,
          stub: true,
          message: `Ollama unreachable (${response.status}) — stub fallback active`,
        };
      }

      return {
        valid: true,
        providerId: this.providerId,
        kind: this.kind,
        stub: false,
        message: `Ollama reachable at ${baseUrl}`,
      };
    } catch {
      return {
        valid: false,
        providerId: this.providerId,
        kind: this.kind,
        stub: true,
        message: "Ollama not running — stub fallback active",
      };
    }
  }

  async executePrompt(request: LlmProviderRequest): Promise<LlmProviderResponse> {
    const validation = await this.validateProvider();
    const model = resolveOllamaModel(request);
    const baseUrl = resolveOllamaBaseUrl();

    if (!validation.valid) {
      return createStubLlmResponse(request, this.kind, this.providerId, { model });
    }

    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          stream: false,
          messages: [
            ...(request.systemPrompt
              ? [{ role: "system", content: request.systemPrompt }]
              : []),
            { role: "user", content: request.prompt },
          ],
        }),
      });

      if (!response.ok) {
        return createStubLlmResponse(request, this.kind, this.providerId, {
          model,
          error: {
            code: "OLLAMA_HTTP_ERROR",
            message: `Ollama request failed (${response.status})`,
          },
        });
      }

      const payload = (await response.json()) as OllamaChatResponse;
      const content = payload.message?.content?.trim() ?? "";

      return {
        success: content.length > 0,
        providerId: this.providerId,
        kind: this.kind,
        stub: false,
        model,
        content,
        streamed: false,
        error:
          content.length > 0
            ? undefined
            : { code: "OLLAMA_EMPTY", message: "Ollama returned empty content" },
      };
    } catch (error) {
      return createStubLlmResponse(request, this.kind, this.providerId, {
        model,
        error: {
          code: "OLLAMA_UNAVAILABLE",
          message:
            error instanceof Error ? error.message : "Ollama provider unavailable",
        },
      });
    }
  }

  async streamResponse(
    request: LlmProviderRequest,
    subscriber: LlmStreamSubscriber,
  ): Promise<LlmProviderResponse> {
    const result = await this.executePrompt(request);
    if (result.success && result.content.length > 0) {
      for (const chunk of result.content.split(" ")) {
        subscriber.onChunk(`${chunk} `);
      }
      subscriber.onComplete?.({ content: result.content });
      return { ...result, streamed: true };
    }

    return { ...result, streamed: true };
  }
}

export function createOllamaProvider(): OllamaProvider {
  return new OllamaProvider();
}
