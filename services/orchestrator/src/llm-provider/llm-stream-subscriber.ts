/**
 * Subscriber for streamed LLM token chunks (Phase 81).
 */
export interface LlmStreamSubscriber {
  readonly subscriberId: string;
  onChunk(chunk: string): void;
  onComplete?(response: { readonly content: string }): void;
}
