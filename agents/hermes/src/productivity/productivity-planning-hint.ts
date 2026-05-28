export interface HermesProductivityPlanningHint {
  readonly productivity: boolean;
  readonly workflowCount: number;
  readonly planningFocus: string;
}

/**
 * Hermes planning hint for daily productivity workflows (Phase 98).
 */
export function evaluateHermesProductivityPlanning(
  description: string,
): HermesProductivityPlanningHint {
  const productivity =
    /\b(email|inbox|organize|priorit|schedule|meeting|remember|brief|research|workspace|summarize)\b/i.test(
      description,
    );

  const clauses = description.split(/,|\band\b/i).filter((part) => part.trim().length > 0);

  return {
    productivity,
    workflowCount: productivity ? Math.min(clauses.length, 4) : 1,
    planningFocus: productivity
      ? "Decompose into daily productivity steps with clear user-facing progress"
      : "Standard planning",
  };
}
