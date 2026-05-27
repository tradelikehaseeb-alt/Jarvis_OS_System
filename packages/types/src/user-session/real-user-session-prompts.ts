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

/** Phase 87 desktop manual validation prompts (exact chat strings). */
export const DESKTOP_VALIDATION_PROMPTS = [
  "What is the gold price today?",
  "Summarize AI news",
  "Plan a 3 day Dubai trip",
  "Explain Bitcoin trend",
] as const;

export type DesktopValidationPrompt = (typeof DESKTOP_VALIDATION_PROMPTS)[number];

export function isDesktopValidationPrompt(
  prompt: string,
): prompt is DesktopValidationPrompt {
  return (DESKTOP_VALIDATION_PROMPTS as readonly string[]).includes(prompt);
}

/** Phase 88 real AI response validation prompts. */
export const REAL_AI_RESPONSE_PROMPTS = [
  "What is the gold price today?",
  "Summarize AI news",
  "Plan a Dubai trip",
  "Explain Bitcoin trend",
] as const;

export type RealAiResponsePrompt = (typeof REAL_AI_RESPONSE_PROMPTS)[number];

export function isRealAiResponsePrompt(
  prompt: string,
): prompt is RealAiResponsePrompt {
  return (REAL_AI_RESPONSE_PROMPTS as readonly string[]).includes(prompt);
}

export function matchesDesktopValidationPrompt(normalizedMessage: string): boolean {
  const candidates = [
    ...REAL_USER_SESSION_PROMPTS,
    ...DESKTOP_VALIDATION_PROMPTS,
    ...REAL_AI_RESPONSE_PROMPTS,
  ] as readonly string[];

  return candidates.some(
    (prompt) => prompt.toLowerCase() === normalizedMessage.trim().toLowerCase(),
  );
}
