import type { SpeechRuntimeProviderId } from "../runtime";

/**
 * Deterministic fallback provider metadata (Phase 39).
 */
export interface SpeechFallbackProvider {
  readonly providerId: SpeechRuntimeProviderId;
  readonly fallbackProviderId: SpeechRuntimeProviderId;
  readonly stub: true;
}
