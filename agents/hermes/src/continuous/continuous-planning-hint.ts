export interface HermesContinuousPlanningHint {
  readonly continuous: boolean;
  readonly background: boolean;
  readonly planningFocus: string;
}

/**
 * Hermes planning hint for continuous and background workflows (Phase 99).
 */
export function evaluateHermesContinuousPlanning(
  description: string,
): HermesContinuousPlanningHint {
  const continuous =
    /\b(monitor|watch|alert|remind|background|continue|every morning|daily briefing|keep watching)\b/i.test(
      description,
    );

  return {
    continuous,
    background: /\b(background|monitor|watch|continue)\b/i.test(description),
    planningFocus: continuous
      ? "Plan safe background supervision with notification throttling and recovery"
      : "Standard planning",
  };
}
