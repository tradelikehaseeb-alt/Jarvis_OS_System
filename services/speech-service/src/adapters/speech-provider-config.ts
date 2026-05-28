/**
 * Provider configuration shared by speech adapters (Phase 28 / Phase 91).
 */
export type SpeechProviderMode = "stub" | "live";

export interface SpeechProviderConfig {
  readonly providerId: string;
  readonly mode: SpeechProviderMode;
  readonly locale?: string;
  readonly apiKey?: string;
  readonly baseUrl?: string;
  readonly model?: string;
}

export const DEFAULT_STUB_SPEECH_PROVIDER_CONFIG: SpeechProviderConfig = {
  providerId: "speech-stub",
  mode: "stub",
};
