import type { LlmProviderRequest } from "../llm-provider-request";
import type { LlmProviderResponse } from "../llm-provider-response";
import type { LlmStreamSubscriber } from "../llm-stream-subscriber";
import {
  DEFAULT_OPENAI_LLM_PROVIDER_ID,
  type LlmProvider,
  type LlmProviderValidation,
} from "../llm-provider";
import {
  createStubLlmResponse,
  readOpenAiApiKey,
  resolveOpenAiModel,
} from "../llm-provider-utils";

interface OpenAiChatResponse {
  readonly choices?: readonly {
    readonly message?: { readonly content?: string };
  }[];
}

export class OpenAiLlmProvider implements LlmProvider {
  readonly providerId = DEFAULT_OPENAI_LLM_PROVIDER_ID;
  readonly kind = "openai" as const;
  readonly label = "OpenAI";

  async validateProvider(): Promise<LlmProviderValidation> {
    const apiKey = readOpenAiApiKey();
    if (!apiKey) {
      return {
        valid: false,
        providerId: this.providerId,
        kind: this.kind,
        stub: true,
        message: "OPENAI_API_KEY not configured — stub fallback active",
      };
    }

    return {
      valid: true,
      providerId: this.providerId,
      kind: this.kind,
      stub: false,
      message: "OpenAI provider configured",
    };
  }

  async executePrompt(request: LlmProviderRequest): Promise<LlmProviderResponse> {
    const validation = await this.validateProvider();
    const model = resolveOpenAiModel(request);

    if (!validation.valid) {
      return createStubLlmResponse(request, this.kind, this.providerId, { model });
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${readOpenAiApiKey()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
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
            code: "OPENAI_HTTP_ERROR",
            message: `OpenAI request failed (${response.status})`,
          },
        });
      }

      const payload = (await response.json()) as OpenAiChatResponse;
      const content = payload.choices?.[0]?.message?.content?.trim() ?? "";

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
            : { code: "OPENAI_EMPTY", message: "OpenAI returned empty content" },
      };
    } catch (error) {
      return createStubLlmResponse(request, this.kind, this.providerId, {
        model,
        error: {
          code: "OPENAI_UNAVAILABLE",
          message:
            error instanceof Error ? error.message : "OpenAI provider unavailable",
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
