/**
 * Desktop chat intent types (Phase 24).
 *
 * Classified locally before `POST /tasks`. Broader than API `intent.kind` alone.
 */
export type ChatIntentType =
  | "plan"
  | "research"
  | "automate"
  | "search"
  | "conversation";

/** All supported chat intent literals (deterministic classifier output). */
export const CHAT_INTENT_TYPES: readonly ChatIntentType[] = [
  "plan",
  "research",
  "automate",
  "search",
  "conversation",
] as const;

/**
 * Result of {@link classifyChatIntent} — static rules only (Phase 24).
 */
export interface IntentClassification {
  /** Detected desktop intent type. */
  readonly intent: ChatIntentType;
  /** Rule id that matched (for tests and Planning Details). */
  readonly ruleId: string;
  /** Human-readable reason (mock/static). */
  readonly reason: string;
  /** Confidence score 0–1 (deterministic, not ML). */
  readonly confidence: number;
}
