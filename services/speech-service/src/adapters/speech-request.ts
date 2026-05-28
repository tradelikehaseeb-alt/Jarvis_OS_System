/**
 * Generic speech request payload used by STT/TTS adapters (Phase 28 / Phase 91).
 */
export interface SpeechRequest {
  readonly requestId: string;
  readonly text: string;
  readonly locale?: string;
  readonly metadata?: Readonly<Record<string, string>>;
  /** Base64-encoded audio for live STT/TTS pipelines. */
  readonly audioBase64?: string;
  readonly mimeType?: string;
}
