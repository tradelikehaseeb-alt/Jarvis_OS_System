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
    const startedAt = Date.now();

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

      if (content.length === 0) {
        return createStubLlmResponse(request, this.kind, this.providerId, { model });
      }

      return {
        success: true,
        providerId: this.providerId,
        kind: this.kind,
        stub: false,
        model,
        content,
        streamed: false,
        latencyMs: Date.now() - startedAt,
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
    const validation = await this.validateProvider();
    const model = resolveOllamaModel(request);
    const baseUrl = resolveOllamaBaseUrl();
    const startedAt = Date.now();

    if (!validation.valid) {
      const stub = createStubLlmResponse(request, this.kind, this.providerId, {
        model,
        streamed: true,
      });
      if (stub.content.length > 0) {
        subscriber.onChunk(stub.content);
        subscriber.onComplete?.({ content: stub.content });
      }
      return stub;
    }

    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          stream: true,
          messages: [
            ...(request.systemPrompt
              ? [{ role: "system", content: request.systemPrompt }]
              : []),
            { role: "user", content: request.prompt },
          ],
        }),
      });

      if (!response.ok || !response.body) {
        const fallback = createStubLlmResponse(request, this.kind, this.providerId, {
          model,
          streamed: true,
        });
        if (fallback.content.length > 0) {
          subscriber.onChunk(fallback.content);
          subscriber.onComplete?.({ content: fallback.content });
        }
        return fallback;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let content = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) {
            continue;
          }

          try {
            const payload = JSON.parse(trimmed) as OllamaChatResponse;
            const delta = payload.message?.content;
            if (typeof delta === "string" && delta.length > 0) {
              content += delta;
              subscriber.onChunk(delta);
            }
          } catch {
            // skip malformed stream lines
          }
        }
      }

      if (content.length === 0) {
        const stub = createStubLlmResponse(request, this.kind, this.providerId, {
          model,
          streamed: true,
        });
        if (stub.content.length > 0) {
          subscriber.onChunk(stub.content);
          subscriber.onComplete?.({ content: stub.content });
        }
        return stub;
      }

      subscriber.onComplete?.({ content });

      return {
        success: true,
        providerId: this.providerId,
        kind: this.kind,
        stub: false,
        model,
        content,
        streamed: true,
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      const fallback = createStubLlmResponse(request, this.kind, this.providerId, {
        model,
        streamed: true,
        error: {
          code: "OLLAMA_UNAVAILABLE",
          message:
            error instanceof Error ? error.message : "Ollama provider unavailable",
        },
      });
      if (fallback.content.length > 0) {
        subscriber.onChunk(fallback.content);
        subscriber.onComplete?.({ content: fallback.content });
      }
      return fallback;
    }
  }
}

export function createOllamaProvider(): OllamaProvider {
  return new OllamaProvider();
}
