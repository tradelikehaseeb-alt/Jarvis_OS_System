import type { BaseSkill } from "./base-skill";
import type { SkillMetadata } from "./skill-metadata";
import type { SkillRegistry } from "./skill-registry";

/**
 * In-memory {@link SkillRegistry} for development and tests (Phase 11).
 */
export class InMemorySkillRegistry implements SkillRegistry {
  readonly registryId = "skill-registry" as const;

  private readonly skills = new Map<string, BaseSkill>();

  async register(skill: BaseSkill): Promise<void> {
    this.skills.set(skill.metadata.skillId, skill);
  }

  async unregister(skillId: string): Promise<boolean> {
    return this.skills.delete(skillId);
  }

  async resolve(skillId: string): Promise<BaseSkill | undefined> {
    return this.skills.get(skillId);
  }

  async list(): Promise<readonly SkillMetadata[]> {
    return [...this.skills.values()].map((s) => s.metadata);
  }
}
