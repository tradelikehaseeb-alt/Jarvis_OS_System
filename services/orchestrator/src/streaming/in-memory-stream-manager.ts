import type { PublishStreamEventInput, StreamEvent } from "./stream-event";
import type { StreamSubscriber } from "./stream-subscriber";
import type { OpenStreamSessionInput, StreamSession } from "./stream-session";
import type { StreamManager } from "./stream-manager";
import type { StreamEventType } from "./stream-event-type";

let sequence = 0;

function nextEventId(): string {
  sequence += 1;
  return `stream-evt-${Date.now()}-${sequence}`;
}

function isTerminalEvent(type: StreamEventType): boolean {
  return type === "execution_completed" || type === "failed";
}

/**
 * In-memory real-time stream manager (Phase 47).
 */
export class InMemoryStreamManager implements StreamManager {
  private readonly sessions = new Map<string, StreamSession>();
  private readonly subscribers = new Map<string, StreamSubscriber>();
  private readonly events: StreamEvent[] = [];

  openSession(input: OpenStreamSessionInput): StreamSession {
    const now = new Date().toISOString();
    const session: StreamSession = {
      streamSessionId: input.streamSessionId,
      taskId: input.taskId,
      userId: input.userId,
      sessionId: input.sessionId,
      conversationId: input.conversationId,
      startedAt: now,
      lastEventAt: now,
      eventCount: 0,
      active: true,
    };
    this.sessions.set(input.streamSessionId, session);
    return session;
  }

  closeSession(streamSessionId: string): StreamSession | undefined {
    const current = this.sessions.get(streamSessionId);
    if (!current) {
      return undefined;
    }
    const closed: StreamSession = {
      ...current,
      active: false,
      lastEventAt: new Date().toISOString(),
    };
    this.sessions.set(streamSessionId, closed);
    return closed;
  }

  publish(input: PublishStreamEventInput): StreamEvent {
    const event: StreamEvent = {
      eventId: nextEventId(),
      type: input.type,
      timestamp: new Date().toISOString(),
      streamSessionId: input.streamSessionId,
      sessionId: input.sessionId,
      taskId: input.taskId,
      userId: input.userId,
      conversationId: input.conversationId,
      message: input.message,
      payload: input.payload,
    };

    this.events.push(event);

    const session = this.sessions.get(input.streamSessionId);
    if (session) {
      this.sessions.set(input.streamSessionId, {
        ...session,
        lastEventAt: event.timestamp,
        eventCount: session.eventCount + 1,
        active: isTerminalEvent(event.type) ? false : session.active,
      });
    }

    for (const subscriber of this.subscribers.values()) {
      subscriber.onEvent(event);
    }

    return event;
  }

  subscribe(subscriber: StreamSubscriber): () => void {
    this.subscribers.set(subscriber.subscriberId, subscriber);
    return () => {
      this.unsubscribe(subscriber.subscriberId);
    };
  }

  unsubscribe(subscriberId: string): void {
    this.subscribers.delete(subscriberId);
  }

  getActiveSessions(): readonly StreamSession[] {
    return [...this.sessions.values()].filter((session) => session.active);
  }
}
