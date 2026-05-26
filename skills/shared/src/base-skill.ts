import type { SkillContext } from "./skill-context";
import type { SkillInput } from "./skill-input";
import type { SkillMetadata } from "./skill-metadata";
import type { SkillOutput } from "./skill-output";

/**
 * Base contract every Jarvis skill must implement.
 *
 * Invoked by agents (Hermes, OpenClaw gateway) — never from UI or api-gateway.
 */
export interface BaseSkill {
  readonly metadata: SkillMetadata;

  /**
   * Run one skill invocation.
   * Must respect sandbox and permission rules when sideEffectCapable.
   */
  execute(input: SkillInput, context: SkillContext): Promise<SkillOutput>;
}

/**
 * Optional abstract base for class-based skills — structure only (Phase 9).
 */
export abstract class AbstractBaseSkill implements BaseSkill {
  abstract readonly metadata: SkillMetadata;

  abstract execute(input: SkillInput, context: SkillContext): Promise<SkillOutput>;
}
