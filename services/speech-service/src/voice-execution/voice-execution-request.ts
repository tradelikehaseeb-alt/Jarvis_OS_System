/**
 * Voice execution request — speech input to task pipeline (Phase 72).
 */
export interface VoiceExecutionRequest {
  readonly requestId: string;
  readonly rawInput: string;
  readonly executionId?: string;
  readonly conversationId?: string;
  readonly userId?: string;
  readonly skipNormalization?: boolean;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
