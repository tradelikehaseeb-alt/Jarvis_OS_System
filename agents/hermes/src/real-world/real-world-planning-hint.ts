export interface HermesRealWorldPlanningHint {
  readonly realWorld: boolean;
  readonly browserWorkflow: boolean;
  readonly planningFocus: string;
}

/**
 * Hermes planning hint for Phase 100 real-world validation workflows.
 */
export function evaluateHermesRealWorldPlanning(description: string): HermesRealWorldPlanningHint {
  const realWorld =
    /\b(open|youtube|gmail|gold|market|trading|workspace|summarize)\b/i.test(description);

  return {
    realWorld,
    browserWorkflow: /\b(open|navigate|browse|gmail|youtube|tradingview)\b/i.test(description),
    planningFocus: realWorld
      ? "Plan concrete executable steps with measurable completion criteria"
      : "Standard planning",
  };
}
