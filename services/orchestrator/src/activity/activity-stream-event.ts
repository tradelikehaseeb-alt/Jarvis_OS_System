import type { StreamEventType } from "../streaming/stream-event-type";

/**
 * Activity stream event source (Phase 71).
 */
export type ActivityStreamSource = "hermes" | "openclaw" | "orchestrator";

/**
 * Live execution activity event for Desktop consumption (Phase 71).
 */
export interface ActivityStreamEvent {
  readonly eventId: string;
  readonly type: StreamEventType;
  readonly timestamp: string;
  readonly streamSessionId: string;
  readonly sessionId: string;
  readonly taskId: string;
  readonly userId: string;
  readonly conversationId?: string;
  readonly message?: string;
  readonly source?: ActivityStreamSource;
  readonly payload?: Readonly<Record<string, unknown>>;
}
