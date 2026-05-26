/**
 * Structured plan returned by {@link HermesAdapter} (Phase 22).
 *
 * Serializable shape for orchestrator payloads — planning output only.
 */
export interface HermesStructuredPlan {
  readonly goal: string;
  readonly steps: readonly string[];
}

/**
 * Output from {@link HermesAdapter.invoke} (Phase 16).
 *
 * Official Hermes integrations populate `plan` and `reasoning` from controlled planners.
 */
export interface HermesResponse {
  readonly success: boolean;
  readonly adapterId: string;
  readonly stub: boolean;
  readonly plan: HermesStructuredPlan & {
    readonly intentKind: string;
    /** Human-readable plan summary (typically mirrors {@link HermesStructuredPlan.goal}). */
    readonly summary: string;
  };
  readonly reasoning: {
    readonly summary: string;
    readonly confidence: number;
  };
  readonly error?: {
    readonly code: string;
    readonly message: string;
  };
}
