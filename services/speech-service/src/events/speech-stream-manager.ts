import type { SpeechStreamSession } from "./speech-stream-session";

/**
 * Pseudo-stream manager contract for deterministic chunk orchestration (Phase 32).
 */
export interface SpeechStreamManager {
  createStream(streamId?: string): SpeechStreamSession;
  appendChunk(streamId: string, text: string): SpeechStreamSession;
  closeStream(streamId: string): SpeechStreamSession;
}
