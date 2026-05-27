/**
 * Active stream session tracked for a task (Phase 47).
 */
export interface StreamSession {
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

export interface OpenStreamSessionInput {
  readonly streamSessionId: string;
  readonly taskId: string;
  readonly userId: string;
  readonly sessionId: string;
  readonly conversationId?: string;
}
