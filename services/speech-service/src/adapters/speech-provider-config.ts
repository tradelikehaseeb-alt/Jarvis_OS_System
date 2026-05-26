/**
 * Provider configuration shared by speech adapters (Phase 28).
 *
 * Stub mode is the only supported mode in this phase.
 */
export interface SpeechProviderConfig {
  readonly providerId: string;
  readonly mode: "stub";
  readonly locale?: string;
}

export const DEFAULT_STUB_SPEECH_PROVIDER_CONFIG: SpeechProviderConfig = {
  providerId: "speech-stub",
  mode: "stub",
};
