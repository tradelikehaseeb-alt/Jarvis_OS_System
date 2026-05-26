/**
 * Stream chunk model for deterministic pseudo-stream sessions (Phase 32).
 */
export interface SpeechStreamChunk {
  readonly chunkId: string;
  readonly text: string;
  readonly index: number;
  readonly at: string;
}
