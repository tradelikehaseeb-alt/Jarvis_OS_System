import type { TransportHealth } from "./transport-health";
import type {
  PublishTransportMessageInput,
  TransportMessage,
} from "./transport-message";
import type {
  OpenTransportSessionInput,
  TransportSession,
} from "./transport-session";
import type { TransportProvider, TransportSubscriberHandler } from "./transport-provider";

let sequence = 0;

function nextMessageId(): string {
  sequence += 1;
  return `transport-msg-${Date.now()}-${sequence}`;
}

function isTerminalType(type: string): boolean {
  return type === "execution_completed" || type === "failed";
}

/**
 * Deterministic in-memory transport provider (Phase 52).
 */
export class InMemoryTransportProvider implements TransportProvider {
  readonly providerId = "in-memory" as const;

  private readonly sessions = new Map<string, TransportSession>();
  private readonly subscribers = new Map<string, TransportSubscriberHandler>();
  private readonly messages: TransportMessage[] = [];

  openSession(input: OpenTransportSessionInput): TransportSession {
    const now = new Date().toISOString();
    const session: TransportSession = {
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

  closeSession(streamSessionId: string): TransportSession | undefined {
    const current = this.sessions.get(streamSessionId);
    if (!current) {
      return undefined;
    }
    const closed: TransportSession = {
      ...current,
      active: false,
      lastEventAt: new Date().toISOString(),
    };
    this.sessions.set(streamSessionId, closed);
    return closed;
  }

  publish(input: PublishTransportMessageInput): TransportMessage {
    const message: TransportMessage = {
      messageId: nextMessageId(),
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

    this.messages.push(message);

    const session = this.sessions.get(input.streamSessionId);
    if (session) {
      this.sessions.set(input.streamSessionId, {
        ...session,
        lastEventAt: message.timestamp,
        eventCount: session.eventCount + 1,
        active: isTerminalType(message.type) ? false : session.active,
      });
    }

    for (const handler of this.subscribers.values()) {
      handler(message);
    }

    return message;
  }

  subscribe(
    subscriberId: string,
    handler: TransportSubscriberHandler,
  ): () => void {
    this.subscribers.set(subscriberId, handler);
    return () => {
      this.unsubscribe(subscriberId);
    };
  }

  unsubscribe(subscriberId: string): void {
    this.subscribers.delete(subscriberId);
  }

  getHealth(): TransportHealth {
    return {
      providerId: this.providerId,
      status: "healthy",
      subscriberCount: this.subscribers.size,
      activeSessionCount: this.getActiveSessions().length,
      messageCount: this.messages.length,
      checkedAt: new Date().toISOString(),
    };
  }

  getActiveSessions(): readonly TransportSession[] {
    return [...this.sessions.values()].filter((session) => session.active);
  }

  getRecentMessages(limit?: number): readonly TransportMessage[] {
    if (limit === undefined) {
      return [...this.messages];
    }
    return this.messages.slice(-limit);
  }

  /** Restore persisted messages without notifying subscribers (Phase 52). */
  restoreMessages(messages: readonly TransportMessage[]): void {
    this.messages.push(...messages);
  }
}
