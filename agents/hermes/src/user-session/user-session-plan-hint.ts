import {
  REAL_USER_SESSION_PROMPTS,
  type RealUserSessionPrompt,
} from "@jarvis/types";

import {
  resolveHermesLiveExecutionPlanHint,
} from "../live-execution/live-execution-plan-hint";

/** Hermes planning hint for a real user session prompt (Phase 86). */
export interface HermesUserSessionPlanHint {
  readonly command: RealUserSessionPrompt;
  readonly goal: string;
  readonly searchIntent: boolean;
  readonly browserIntent: boolean;
  readonly summaryIntent: boolean;
}

function inferUserSessionHint(prompt: RealUserSessionPrompt): HermesUserSessionPlanHint {
  const lower = prompt.toLowerCase();

  return {
    command: prompt,
    goal: prompt,
    searchIntent:
      lower.includes("gold price") ||
      lower.includes("bitcoin") ||
      lower.includes("ai news"),
    browserIntent: lower.includes("travel") || lower.includes("dubai"),
    summaryIntent:
      lower.includes("summarize") ||
      lower.includes("explain") ||
      lower.includes("plan") ||
      lower.includes("itinerary"),
  };
}

/** Resolve Hermes plan hint for real user session prompts (Phase 86). */
export function resolveHermesUserSessionPlanHint(
  prompt: string,
): HermesUserSessionPlanHint | undefined {
  if (!(REAL_USER_SESSION_PROMPTS as readonly string[]).includes(prompt)) {
    const legacy = resolveHermesLiveExecutionPlanHint(prompt);
    if (!legacy) {
      return undefined;
    }

    return {
      command: prompt as RealUserSessionPrompt,
      goal: legacy.goal,
      searchIntent: legacy.searchIntent,
      browserIntent: legacy.browserIntent,
      summaryIntent: legacy.summaryIntent,
    };
  }

  return inferUserSessionHint(prompt as RealUserSessionPrompt);
}

/** All registered user session plan hints (Phase 86). */
export function listHermesUserSessionPlanHints(): readonly HermesUserSessionPlanHint[] {
  return REAL_USER_SESSION_PROMPTS.map((prompt) => inferUserSessionHint(prompt));
}

/** Check whether a prompt is a canonical user session command. */
export function isHermesUserSessionPrompt(
  prompt: string,
): prompt is RealUserSessionPrompt {
  return (REAL_USER_SESSION_PROMPTS as readonly string[]).includes(prompt);
}
