/**
 * Generic speech adapter response model (Phase 28).
 *
 * For stubs, `output` is deterministic mock text only.
 */
export interface SpeechResponse {
  readonly requestId: string;
  readonly adapterId: string;
  readonly providerId: string;
  readonly stub: boolean;
  readonly output: string;
  readonly createdAt: string;
}
