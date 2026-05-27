import type { LlmProviderRequest } from "./llm-provider-request";
import type { LlmProviderResponse } from "./llm-provider-response";
import type { LlmStreamSubscriber } from "./llm-stream-subscriber";

/** Supported LLM provider kinds (Phase 81). */
export type LlmProviderKind = "openai" | "ollama" | "stub";

export interface LlmProviderValidation {
  readonly valid: boolean;
  readonly providerId: string;
  readonly kind: LlmProviderKind;
  readonly stub: boolean;
  readonly message: string;
}

/**
 * LLM provider contract — prompt execution with validation and streaming (Phase 81).
 */
export interface LlmProvider {
  readonly providerId: string;
  readonly kind: LlmProviderKind;
  readonly label: string;
  validateProvider(): Promise<LlmProviderValidation>;
  executePrompt(request: LlmProviderRequest): Promise<LlmProviderResponse>;
  streamResponse(
    request: LlmProviderRequest,
    subscriber: LlmStreamSubscriber,
  ): Promise<LlmProviderResponse>;
}

export const DEFAULT_STUB_LLM_PROVIDER_ID = "llm-stub" as const;
export const DEFAULT_OPENAI_LLM_PROVIDER_ID = "openai" as const;
export const DEFAULT_OLLAMA_LLM_PROVIDER_ID = "ollama" as const;
