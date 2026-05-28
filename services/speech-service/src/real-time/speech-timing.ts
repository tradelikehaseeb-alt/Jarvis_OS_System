/**
 * Natural speech chunk timing for lower perceived latency (Phase 92).
 */
export function naturalWordDelayMs(word: string): number {
  const base = 26;
  const punctuationPause = /[.!?]$/.test(word) ? 85 : 0;
  const lengthPause = Math.min(36, Math.max(0, word.length - 4) * 3);
  return base + lengthPause + punctuationPause;
}

/**
 * Reduces partial transcript flicker by preserving stable prefix (Phase 92).
 */
export function stabilizePartialTranscript(
  previous: string,
  incoming: string,
): string {
  const next = incoming.trim();
  if (!next) {
    return previous;
  }
  if (!previous) {
    return next;
  }
  if (next.startsWith(previous) || previous.startsWith(next)) {
    return next.length >= previous.length ? next : previous;
  }

  const prevWords = previous.split(/\s+/).filter(Boolean);
  const nextWords = next.split(/\s+/).filter(Boolean);
  let shared = 0;
  while (
    shared < prevWords.length &&
    shared < nextWords.length &&
    prevWords[shared] === nextWords[shared]
  ) {
    shared += 1;
  }

  if (shared > 0) {
    return next;
  }

  return next;
}
