import type { LlmProviderKind } from "./llm-provider";

/**
 * LLM prompt execution response (Phase 81).
 */
export interface LlmProviderResponse {
  readonly success: boolean;
  readonly providerId: string;
  readonly kind: LlmProviderKind;
  readonly stub: boolean;
  readonly model: string;
  readonly content: string;
  readonly streamed: boolean;
  /** Round-trip latency in milliseconds when measured (Phase 89). */
  readonly latencyMs?: number;
  readonly error?: {
    readonly code: string;
    readonly message: string;
  };
}
