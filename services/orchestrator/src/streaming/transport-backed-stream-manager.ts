import type { PublishStreamEventInput, StreamEvent } from "./stream-event";
import type { StreamSubscriber } from "./stream-subscriber";
import type { OpenStreamSessionInput, StreamSession } from "./stream-session";
import type { StreamManager } from "./stream-manager";
import type { StreamEventType } from "./stream-event-type";
import type { TransportRuntime } from "../transport/transport-runtime";

function toStreamEvent(message: {
  messageId: string;
  type: string;
  timestamp: string;
  streamSessionId: string;
  sessionId: string;
  taskId: string;
  userId: string;
  conversationId?: string;
  message?: string;
  payload?: Readonly<Record<string, unknown>>;
}): StreamEvent {
  return {
    eventId: message.messageId,
    type: message.type as StreamEventType,
    timestamp: message.timestamp,
    streamSessionId: message.streamSessionId,
    sessionId: message.sessionId,
    taskId: message.taskId,
    userId: message.userId,
    conversationId: message.conversationId,
    message: message.message,
    payload: message.payload,
  };
}

/**
 * {@link StreamManager} backed by {@link TransportRuntime} (Phase 52).
 */
export class TransportBackedStreamManager implements StreamManager {
  constructor(private readonly runtime: TransportRuntime) {}

  openSession(input: OpenStreamSessionInput): StreamSession {
    return this.runtime.openSession(input);
  }

  closeSession(streamSessionId: string): StreamSession | undefined {
    return this.runtime.closeSession(streamSessionId);
  }

  publish(input: PublishStreamEventInput): StreamEvent {
    const message = this.runtime.publish(input);
    return toStreamEvent(message);
  }

  subscribe(subscriber: StreamSubscriber): () => void {
    return this.runtime.subscribe(subscriber.subscriberId, (message) => {
      subscriber.onEvent(toStreamEvent(message));
    });
  }

  unsubscribe(subscriberId: string): void {
    this.runtime.unsubscribe(subscriberId);
  }

  getActiveSessions(): readonly StreamSession[] {
    return this.runtime.getActiveSessions();
  }
}
