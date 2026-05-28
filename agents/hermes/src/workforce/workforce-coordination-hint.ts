export interface HermesWorkforceCoordinationHint {
  readonly multiAgent: boolean;
  readonly workerCount: number;
  readonly planningFocus: string;
}

/**
 * Hermes planning hint for coordinated multi-agent workflows (Phase 97).
 */
export function evaluateHermesWorkforceCoordination(
  description: string,
): HermesWorkforceCoordinationHint {
  const clauses = description.split(/,|\band\b/i).filter((part) => part.trim().length > 0);
  const multiAgent =
    clauses.length >= 2 &&
    /\b(research|analyze|prepare|summarize|market|brief)\b/i.test(description);

  return {
    multiAgent,
    workerCount: multiAgent ? Math.min(clauses.length, 5) : 1,
    planningFocus: multiAgent
      ? "Decompose into parallel specialized worker steps with clear handoffs"
      : "Single-agent planning",
  };
}
