/**
 * Active transport session for a task stream (Phase 52).
 */
export interface TransportSession {
  readonly streamSessionId: string;
  readonly taskId: string;
  readonly userId: string;
  readonly sessionId: string;
  readonly conversationId?: string;
  readonly startedAt: string;
  readonly lastEventAt: string;
  readonly eventCount: number;
  readonly active: boolean;
}

export interface OpenTransportSessionInput {
  readonly streamSessionId: string;
  readonly taskId: string;
  readonly userId: string;
  readonly sessionId: string;
  readonly conversationId?: string;
}
