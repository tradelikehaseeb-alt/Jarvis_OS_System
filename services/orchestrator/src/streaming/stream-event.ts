import type { StreamEventType } from "./stream-event-type";

/**
 * Real-time orchestrator stream event (Phase 47).
 */
export interface StreamEvent {
  readonly eventId: string;
  readonly type: StreamEventType;
  readonly timestamp: string;
  readonly streamSessionId: string;
  readonly sessionId: string;
  readonly taskId: string;
  readonly userId: string;
  readonly conversationId?: string;
  readonly message?: string;
  readonly payload?: Readonly<Record<string, unknown>>;
}

export interface PublishStreamEventInput {
  readonly type: StreamEventType;
  readonly streamSessionId: string;
  readonly sessionId: string;
  readonly taskId: string;
  readonly userId: string;
  readonly conversationId?: string;
  readonly message?: string;
  readonly payload?: Readonly<Record<string, unknown>>;
}
