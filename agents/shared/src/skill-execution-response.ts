/**
 * Agent ← skill execution response (Phase 11 pipeline).
 */
export interface SkillExecutionError {
  readonly code: string;
  readonly message: string;
  readonly details?: Readonly<Record<string, unknown>>;
}

export interface SkillExecutionResponse {
  readonly executionId: string;
  readonly agentId: string;
  readonly skillId: string;
  readonly success: boolean;
  readonly data?: Readonly<Record<string, unknown>>;
  readonly error?: SkillExecutionError;
}
