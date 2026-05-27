/**
 * Voice execution classification snapshot (Phase 72).
 */
export interface VoiceExecutionClassification {
  readonly intent: string;
  readonly ruleId: string;
  readonly confidence?: number;
  readonly reason?: string;
}

/**
 * Speech pipeline metadata from voice execution (Phase 72).
 */
export interface VoiceExecutionSpeechMetadata {
  readonly detectedAction?: string;
  readonly providerDecision?: string;
  readonly conversationState?: string;
  readonly normalizationApplied?: boolean;
}

/**
 * Voice execution result — speech + optional task pipeline (Phase 72).
 */
export interface VoiceExecutionResult {
  readonly executionId: string;
  readonly requestId: string;
  readonly originalInput: string;
  readonly normalizedInput: string;
  readonly speechMetadata?: VoiceExecutionSpeechMetadata;
  readonly classification?: VoiceExecutionClassification;
  readonly taskId?: string;
  readonly taskStatus?: unknown;
  readonly activityStream?: unknown;
  readonly success: boolean;
  readonly error?: {
    readonly code: string;
    readonly message: string;
  };
}
