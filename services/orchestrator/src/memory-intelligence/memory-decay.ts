/**
 * Computes memory decay factor from turn age (Phase 93).
 * Returns 0–1 where 1 is fresh and stale turns approach 0.
 */
export function memoryDecayFactor(
  timestamp: string,
  nowMs = Date.now(),
  halfLifeHours = 72,
): number {
  const turnMs = Date.parse(timestamp);
  if (Number.isNaN(turnMs)) {
    return 0.5;
  }
  const ageHours = Math.max(0, (nowMs - turnMs) / (1000 * 60 * 60));
  if (ageHours <= 0) {
    return 1;
  }
  return Math.max(0.05, Math.pow(0.5, ageHours / halfLifeHours));
}

/**
 * Semantic overlap score between intent text and turn message (Phase 93).
 */
export function semanticOverlapScore(intentText: string, message: string): number {
  const intentWords = new Set(
    intentText
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 2),
  );
  if (intentWords.size === 0) {
    return 0;
  }
  const messageWords = message.toLowerCase().split(/\s+/);
  let matches = 0;
  for (const word of messageWords) {
    if (intentWords.has(word)) {
      matches += 1;
    }
  }
  return Math.min(1, matches / intentWords.size);
}
