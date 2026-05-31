/** Groq / OpenAI context window used for orchestrator context packing. */
export const ORCHESTRATOR_CONTEXT_TOKEN_LIMIT = 131_072 as const;

const CHARS_PER_TOKEN_ESTIMATE = 4;

/**
 * Rough token estimate (chars / 4) for context budget checks.
 */
export function estimateTokenCount(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return 0;
  }
  return Math.ceil(trimmed.length / CHARS_PER_TOKEN_ESTIMATE);
}

/**
 * Returns messages that fit within the token budget (newest-first trim).
 */
export function trimMessagesToTokenBudget<
  T extends { readonly message: string },
>(
  messages: readonly T[],
  maxTokens: number = ORCHESTRATOR_CONTEXT_TOKEN_LIMIT,
): readonly T[] {
  const selected: T[] = [];
  let used = 0;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const entry = messages[index];
    if (!entry) {
      continue;
    }
    const cost = estimateTokenCount(entry.message);
    if (used + cost > maxTokens) {
      break;
    }
    used += cost;
    selected.unshift(entry);
  }

  return selected;
}
