/**
 * Extracts intent keywords for relevance scoring (Phase 67).
 */
export function extractKeywords(text?: string): string[] {
  if (!text) {
    return [];
  }
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3);
}
