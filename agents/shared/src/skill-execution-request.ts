/**
 * Agent → skill execution request (Phase 11 pipeline).
 * Agents must dispatch skills only via {@link SkillExecutor}.
 */
export interface SkillExecutionRequest {
  readonly executionId: string;
  readonly agentId: string;
  readonly skillId: string;
  readonly userId: string;
  readonly parameters: Readonly<Record<string, unknown>>;
  readonly contextRef: string;
  readonly workflowStepId?: string;
  readonly correlationId?: string;
}
