/**
 * Chat intent types (Phase 24) — shared by desktop UI and orchestrator e2e.
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
  readonly intent: ChatIntentType;
  readonly ruleId: string;
  readonly reason: string;
  readonly confidence: number;
}
