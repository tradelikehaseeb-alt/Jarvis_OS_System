/**
 * Turn shape for summary generation (Phase 67).
 */
export interface TurnSummaryInput {
  readonly role: string;
  readonly message: string;
}

/**
 * Builds a human-readable summary from conversation turns (Phase 67).
 */
export function summarizeTurns(
  turns: readonly TurnSummaryInput[],
  intentDescription?: string,
  label = "prior",
): string {
  if (turns.length === 0) {
    return intentDescription
      ? `No prior conversation context for: ${intentDescription}`
      : "No prior conversation context";
  }

  const preview = turns
    .slice(-3)
    .map((turn) => `${turn.role}: ${turn.message}`)
    .join(" | ");

  return `${turns.length} ${label} turn(s). Recent: ${preview}`;
}
