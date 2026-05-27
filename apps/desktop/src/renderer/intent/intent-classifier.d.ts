import type { ChatIntentType, IntentClassification } from "./intent-types";
/**
 * Classify user chat text with deterministic keyword rules (Phase 24).
 *
 * No LLM calls. Output is stable for the same input.
 */
export declare function classifyChatIntent(message: string): IntentClassification;
/** Loading copy keyed by classified intent (preserves Hermes planning UX for `plan`). */
export declare function loadingMessageForIntent(intent: ChatIntentType): string;
//# sourceMappingURL=intent-classifier.d.ts.map