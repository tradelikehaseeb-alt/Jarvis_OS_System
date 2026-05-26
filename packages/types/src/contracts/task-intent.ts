/**
 * Declared intent behind a user task — what the user wants accomplished.
 */
export interface TaskIntent {
  /** Intent category (e.g. "automate", "research", "draft"). */
  readonly kind: string;
  /** Natural-language or structured intent payload. */
  readonly description: string;
  /** Optional structured parameters for planners (Hermes, Phase 3+). */
  readonly parameters?: Readonly<Record<string, unknown>>;
  /** Relative urgency; orchestrator may reorder queue (Phase 3+). */
  readonly priority?: TaskIntentPriority;
}

/** Task intent priority levels. */
export type TaskIntentPriority = "low" | "normal" | "high" | "critical";
