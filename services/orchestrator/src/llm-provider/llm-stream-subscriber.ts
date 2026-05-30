/**
 * Subscriber for streamed LLM token chunks (Phase 81).
 */
export interface LlmStreamSubscriber {
  readonly subscriberId: string;
  onChunk(chunk: string): void;
  onComplete?(response: { readonly content: string }): void;
}

/** Legacy callback shape accepted by some callers. */
export type LlmStreamSubscriberInput =
  | LlmStreamSubscriber
  | ((chunk: string) => void);

/**
 * Normalize function or partial subscriber into {@link LlmStreamSubscriber}.
 */
export function normalizeLlmStreamSubscriber(
  input: LlmStreamSubscriberInput,
  fallbackId = "stream",
): LlmStreamSubscriber {
  if (typeof input === "function") {
    return {
      subscriberId: fallbackId,
      onChunk: input,
    };
  }

  if (typeof input.onChunk === "function") {
    return {
      subscriberId:
        typeof input.subscriberId === "string" && input.subscriberId.length > 0
          ? input.subscriberId
          : fallbackId,
      onChunk: input.onChunk,
      onComplete: input.onComplete,
    };
  }

  throw new TypeError(
    "streamResponse requires an LlmStreamSubscriber with onChunk(chunk: string)",
  );
}
