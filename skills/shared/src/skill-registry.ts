import type { BaseSkill } from "./base-skill";
import type { SkillMetadata } from "./skill-metadata";

/**
 * Registry for skill implementations — agents resolve skills by id.
 *
 * Distinct from orchestrator workflow step `skillId` wiring (Phase 10+).
 */
export interface SkillRegistry {
  readonly registryId: "skill-registry";

  register(skill: BaseSkill): Promise<void>;

  unregister(skillId: string): Promise<boolean>;

  resolve(skillId: string): Promise<BaseSkill | undefined>;

  list(): Promise<readonly SkillMetadata[]>;
}
