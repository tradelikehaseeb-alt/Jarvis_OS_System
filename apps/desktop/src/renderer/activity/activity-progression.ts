import type { ActivityEventKind } from "./activity-event";

/** Deterministic staged events while waiting for task response (Phase 48). */
export const ACTIVITY_PROGRESSION_BY_INTENT: Readonly<
  Record<string, readonly ActivityEventKind[]>
> = {
  automate: [
    "execution_started",
    "planning_started",
    "planning_completed",
    "execution_started",
    "execution_completed",
  ],
  plan: [
    "execution_started",
    "planning_started",
    "planning_completed",
    "execution_completed",
  ],
  research: [
    "execution_started",
    "planning_started",
    "planning_completed",
    "memory_saved",
    "execution_completed",
  ],
  draft: [
    "execution_started",
    "planning_started",
    "planning_completed",
    "execution_completed",
  ],
  default: [
    "execution_started",
    "planning_started",
    "planning_completed",
    "execution_completed",
  ],
};

export const DEFAULT_ACTIVITY_STEP_MS = 280;

export function progressionForIntent(intentKind: string): readonly ActivityEventKind[] {
  return (
    ACTIVITY_PROGRESSION_BY_INTENT[intentKind] ??
    ACTIVITY_PROGRESSION_BY_INTENT.default
  );
}
