import type { SpeechStreamChunk } from "./speech-stream-chunk";
import type { SpeechStreamManager } from "./speech-stream-manager";
import type { SpeechStreamSession } from "./speech-stream-session";

const FIXED_TIMESTAMP = new Date(0).toISOString();

/**
 * In-memory deterministic stream manager (Phase 32).
 */
export class InMemorySpeechStreamManager implements SpeechStreamManager {
  private readonly streams = new Map<string, SpeechStreamSession>();
  private streamSequence = 0;
  private chunkSequence = 0;

  createStream(streamId?: string): SpeechStreamSession {
    const id = streamId ?? `speech-stream-${++this.streamSequence}`;
    const existing = this.streams.get(id);
    if (existing) {
      return existing;
    }
    const created: SpeechStreamSession = {
      streamId: id,
      chunks: [],
      closed: false,
      createdAt: FIXED_TIMESTAMP,
      updatedAt: FIXED_TIMESTAMP,
    };
    this.streams.set(id, created);
    return created;
  }

  appendChunk(streamId: string, text: string): SpeechStreamSession {
    const current = this.requireStream(streamId);
    if (current.closed) {
      throw new Error(`Speech stream is closed: ${streamId}`);
    }
    const chunk: SpeechStreamChunk = {
      chunkId: `speech-chunk-${++this.chunkSequence}`,
      text,
      index: current.chunks.length,
      at: FIXED_TIMESTAMP,
    };
    const updated: SpeechStreamSession = {
      ...current,
      chunks: [...current.chunks, chunk],
      updatedAt: FIXED_TIMESTAMP,
    };
    this.streams.set(streamId, updated);
    return updated;
  }

  closeStream(streamId: string): SpeechStreamSession {
    const current = this.requireStream(streamId);
    if (current.closed) {
      return current;
    }
    const updated: SpeechStreamSession = {
      ...current,
      closed: true,
      closedAt: FIXED_TIMESTAMP,
      updatedAt: FIXED_TIMESTAMP,
    };
    this.streams.set(streamId, updated);
    return updated;
  }

  private requireStream(streamId: string): SpeechStreamSession {
    const stream = this.streams.get(streamId);
    if (!stream) {
      throw new Error(`Speech stream not found: ${streamId}`);
    }
    return stream;
  }
}
