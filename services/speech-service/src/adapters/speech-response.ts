/**
 * Generic speech adapter response model (Phase 28 / Phase 91).
 */
export interface SpeechAdapterError {
  readonly code: string;
  readonly message: string;
}

export interface SpeechResponse {
  readonly requestId: string;
  readonly adapterId: string;
  readonly providerId: string;
  readonly stub: boolean;
  readonly output: string;
  readonly createdAt: string;
  readonly confidence?: number;
  readonly latencyMs?: number;
  readonly audioBase64?: string;
  readonly mimeType?: string;
  /** Set when transcript contains a Jarvis wake phrase. */
  readonly isWakeWord?: boolean;
  readonly error?: SpeechAdapterError;
}
