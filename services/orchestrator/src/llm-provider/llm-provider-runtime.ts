import type { LlmProviderRequest } from "./llm-provider-request";
import type { LlmProviderResponse } from "./llm-provider-response";
import type { LlmProviderValidation } from "./llm-provider";
import type { LlmStreamSubscriberInput } from "./llm-stream-subscriber";

/**
 * Orchestrator LLM provider runtime contract (Phase 81).
 */
export interface LlmProviderRuntime {
  executePrompt(request: LlmProviderRequest): Promise<LlmProviderResponse>;
  validateProvider(providerId: string): Promise<LlmProviderValidation>;
  streamResponse(
    request: LlmProviderRequest,
    subscriber: LlmStreamSubscriberInput,
  ): Promise<LlmProviderResponse>;
  listProviders(): readonly { readonly providerId: string; readonly kind: string; readonly label: string }[];
}
