import type { SpeechStreamChunk } from "./speech-stream-chunk";

/**
 * In-memory stream session state (Phase 32).
 */
export interface SpeechStreamSession {
  readonly streamId: string;
  readonly chunks: readonly SpeechStreamChunk[];
  readonly closed: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly closedAt?: string;
}
