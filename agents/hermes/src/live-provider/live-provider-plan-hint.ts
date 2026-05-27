import {
  REAL_PROVIDER_VALIDATION_COMMANDS,
  type RealProviderValidationCommand,
} from "@jarvis/types";

import {
  resolveHermesLiveExecutionPlanHint,
  type HermesLiveExecutionPlanHint,
} from "../live-execution/live-execution-plan-hint";

/** Hermes planning hint for a real provider validation prompt (Phase 85). */
export type HermesLiveProviderPlanHint = HermesLiveExecutionPlanHint;

/** Resolve Hermes plan hint for real provider validation prompts (Phase 85). */
export function resolveHermesLiveProviderPlanHint(
  prompt: string,
): HermesLiveProviderPlanHint | undefined {
  if (!(REAL_PROVIDER_VALIDATION_COMMANDS as readonly string[]).includes(prompt)) {
    return undefined;
  }

  return resolveHermesLiveExecutionPlanHint(prompt);
}

/** All registered real provider validation plan hints (Phase 85). */
export function listHermesLiveProviderPlanHints(): readonly HermesLiveProviderPlanHint[] {
  return REAL_PROVIDER_VALIDATION_COMMANDS.map(
    (command) => resolveHermesLiveExecutionPlanHint(command)!,
  ).filter((hint): hint is HermesLiveProviderPlanHint => hint !== undefined);
}

/** Check whether a prompt is a canonical real provider validation command. */
export function isHermesLiveProviderPrompt(
  prompt: string,
): prompt is RealProviderValidationCommand {
  return (REAL_PROVIDER_VALIDATION_COMMANDS as readonly string[]).includes(prompt);
}
