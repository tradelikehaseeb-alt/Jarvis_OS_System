import type { SpeechRuntimeHealth, SpeechRuntimeProviderId } from "./speech-runtime-health";

/**
 * Runtime provider contract for speech engines (Phase 29).
 */
export interface SpeechRuntimeProvider {
  readonly providerId: SpeechRuntimeProviderId;
  checkHealth(): Promise<SpeechRuntimeHealth>;
}
