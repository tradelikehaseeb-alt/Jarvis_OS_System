import type { HermesSkillCategory } from "@jarvis/types";

/**
 * Structured plan returned by {@link HermesAdapter} (Phase 22).
 *
 * Serializable shape for orchestrator payloads — planning output only.
 */
export interface HermesStructuredPlan {
  readonly goal: string;
  readonly steps: readonly string[];
  readonly executionSteps?: readonly HermesExecutionPlanStep[];
}

/**
 * Machine-readable execution step owned by Hermes planning.
 */
export interface HermesExecutionPlanStep {
  readonly stepId: string;
  readonly agent: "hermes" | "openclaw";
  readonly skill: "search" | "browser" | "file" | "memory" | "reminder";
  readonly action: string;
  readonly params: Readonly<Record<string, unknown>>;
  readonly dependsOn: readonly string[];
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
    /** Fast Groq/Gemini chat vs Python skills subprocess. */
    readonly executionMode?: "fast" | "skills";
    readonly skillCategory?: HermesSkillCategory;
    readonly userStatusMessage?: string;
    readonly llmProvider?: "groq" | "gemini";
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
