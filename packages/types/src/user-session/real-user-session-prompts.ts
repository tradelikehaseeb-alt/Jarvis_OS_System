/** Canonical real user session prompts (Phase 86). */
export const REAL_USER_SESSION_PROMPTS = [
  "What is the gold price today?",
  "Summarize latest AI news",
  "Plan a Dubai travel itinerary",
  "Explain Bitcoin market trend",
] as const;

export type RealUserSessionPrompt = (typeof REAL_USER_SESSION_PROMPTS)[number];

export function isRealUserSessionPrompt(
  prompt: string,
): prompt is RealUserSessionPrompt {
  return (REAL_USER_SESSION_PROMPTS as readonly string[]).includes(prompt);
}
