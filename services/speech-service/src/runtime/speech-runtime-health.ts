import type { SpeechRuntimeStatus } from "./speech-runtime-status";

export type SpeechRuntimeProviderId =
  | "stt-local"
  | "stt-cloud"
  | "tts-local"
  | "tts-cloud";

/**
 * Health model returned by runtime providers and manager (Phase 29).
 */
export interface SpeechRuntimeHealth {
  readonly providerId: SpeechRuntimeProviderId;
  readonly status: SpeechRuntimeStatus;
  readonly stub: true;
  readonly checkedAt: string;
  readonly details: string;
}
