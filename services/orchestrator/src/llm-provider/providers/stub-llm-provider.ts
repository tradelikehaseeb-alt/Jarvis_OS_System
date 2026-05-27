import type { LlmProviderRequest } from "../llm-provider-request";
import type { LlmProviderResponse } from "../llm-provider-response";
import type { LlmStreamSubscriber } from "../llm-stream-subscriber";
import {
  DEFAULT_STUB_LLM_PROVIDER_ID,
  type LlmProvider,
  type LlmProviderValidation,
} from "../llm-provider";
import { buildStubLlmContent, createStubLlmResponse } from "../llm-provider-utils";

export class StubLlmProvider implements LlmProvider {
  readonly providerId = DEFAULT_STUB_LLM_PROVIDER_ID;
  readonly kind = "stub" as const;
  readonly label = "LLM Stub";

  async validateProvider(): Promise<LlmProviderValidation> {
    return {
      valid: true,
      providerId: this.providerId,
      kind: this.kind,
      stub: true,
      message: "Deterministic stub LLM provider ready",
    };
  }

  async executePrompt(request: LlmProviderRequest): Promise<LlmProviderResponse> {
    return createStubLlmResponse(request, this.kind, this.providerId);
  }

  async streamResponse(
    request: LlmProviderRequest,
    subscriber: LlmStreamSubscriber,
  ): Promise<LlmProviderResponse> {
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
