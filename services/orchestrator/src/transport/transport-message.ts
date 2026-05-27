/**
 * Message published through the orchestrator transport runtime (Phase 52).
 */
export interface TransportMessage {
  readonly messageId: string;
  readonly type: string;
  readonly timestamp: string;
  readonly streamSessionId: string;
  readonly sessionId: string;
  readonly taskId: string;
  readonly userId: string;
  readonly conversationId?: string;
  readonly message?: string;
  readonly payload?: Readonly<Record<string, unknown>>;
}

export interface PublishTransportMessageInput {
  readonly type: string;
  readonly streamSessionId: string;
  readonly sessionId: string;
  readonly taskId: string;
  readonly userId: string;
  readonly conversationId?: string;
  readonly message?: string;
  readonly payload?: Readonly<Record<string, unknown>>;
}
