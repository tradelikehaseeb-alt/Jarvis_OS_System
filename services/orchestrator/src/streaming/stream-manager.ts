import type { PublishStreamEventInput, StreamEvent } from "./stream-event";
import type { StreamSubscriber } from "./stream-subscriber";
import type { StreamSession } from "./stream-session";

/**
 * Real-time event stream manager contract (Phase 47).
 */
export interface StreamManager {
  publish(input: PublishStreamEventInput): StreamEvent;
  subscribe(subscriber: StreamSubscriber): () => void;
  unsubscribe(subscriberId: string): void;
  getActiveSessions(): readonly StreamSession[];
  openSession(input: import("./stream-session").OpenStreamSessionInput): StreamSession;
  closeSession(streamSessionId: string): StreamSession | undefined;
}
