/** Derived feedback signal kinds (Phase 80). */
export type FeedbackSignalKind =
  | "user_satisfied"
  | "user_frustrated"
  | "user_prefers_retry"
  | "no_feedback";

/**
 * Signal derived from explicit user feedback history (Phase 80).
 */
export interface FeedbackSignal {
  readonly kind: FeedbackSignalKind;
  readonly message: string;
  readonly confidence: number;
  readonly sampleSize: number;
}
