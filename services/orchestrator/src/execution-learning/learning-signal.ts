/** Derived learning signal kinds (Phase 79). */
export type LearningSignalKind =
  | "stable_success"
  | "elevated_failure_rate"
  | "retry_recommended"
  | "no_data";

/**
 * Signal derived from historical execution outcomes (Phase 79).
 */
export interface LearningSignal {
  readonly kind: LearningSignalKind;
  readonly message: string;
  readonly confidence: number;
  readonly sampleSize: number;
}
