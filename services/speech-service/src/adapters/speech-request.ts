/**
 * Generic speech request payload used by STT/TTS adapters (Phase 28).
 *
 * `text` remains text-only for deterministic stubs; no microphone/audio access.
 */
export interface SpeechRequest {
  readonly requestId: string;
  readonly text: string;
  readonly locale?: string;
  readonly metadata?: Readonly<Record<string, string>>;
}
