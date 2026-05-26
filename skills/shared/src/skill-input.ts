/**
 * Input payload passed from an agent to a skill.
 */
export interface SkillInput {
  readonly invocationId: string;
  readonly skillId: string;
  /** Agent that invoked the skill. */
  readonly agentId: string;
  readonly userId: string;
  /** Skill-specific parameters (validated by skill in Phase 10+). */
  readonly parameters: Readonly<Record<string, unknown>>;
  readonly correlationId?: string;
}
