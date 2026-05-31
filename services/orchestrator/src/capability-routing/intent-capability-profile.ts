import type { TaskIntent } from "@jarvis/types";

/**
 * Static map: TaskIntent.kind → required capability tokens (Phase 12 stub).
 * Uses registry metadata strings only — no agent package imports.
 */
export const INTENT_CAPABILITY_PROFILE: Readonly<
  Record<string, readonly string[]>
> = {
  chat: ["planning", "reasoning"],
  research: ["planning", "reasoning", "memory-access"],
  automate: ["browser-automation", "desktop-automation", "execution"],
  browse: ["browser-automation", "desktop-automation", "execution"],
  cron: ["planning", "reasoning", "task-decomposition"],
  plan: ["planning", "reasoning", "task-decomposition"],
  draft: ["planning", "reasoning"],
  default: ["planning", "reasoning"],
};

/**
 * Resolve required capabilities for an intent (deterministic).
 */
export function requiredCapabilitiesForIntent(
  intent: TaskIntent,
): readonly string[] {
  return INTENT_CAPABILITY_PROFILE[intent.kind] ?? INTENT_CAPABILITY_PROFILE.default;
}
