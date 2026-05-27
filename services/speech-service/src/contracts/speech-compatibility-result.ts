/**
 * Result of provider contract/compatibility validation (Phase 40).
 */
export interface SpeechCompatibilityResult {
  readonly compatible: boolean;
  readonly providerId: string;
  readonly version: string;
  readonly stub: boolean;
  readonly reasons: readonly string[];
}
