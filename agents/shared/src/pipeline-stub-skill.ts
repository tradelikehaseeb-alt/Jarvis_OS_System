import {
  AbstractBaseSkill,
  type SkillContext,
  type SkillInput,
  type SkillMetadata,
  type SkillOutput,
} from "@jarvis/skills-shared";

/**
 * Pipeline placeholder skill — not a real capability (Phase 11).
 * Used to wire agent→skill protocol with static responses.
 */
export class PipelineStubSkill extends AbstractBaseSkill {
  constructor(readonly metadata: SkillMetadata) {}

  async execute(input: SkillInput, _context: SkillContext): Promise<SkillOutput> {
    return {
      invocationId: input.invocationId,
      skillId: this.metadata.skillId,
      success: true,
      data: {
        stub: true,
        pipeline: true,
        skillId: this.metadata.skillId,
      },
    };
  }
}
