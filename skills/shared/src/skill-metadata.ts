import type { SkillCapability } from "./skill-capability";

/**
 * Static descriptor for a registered skill.
 */
export interface SkillMetadata {
  readonly skillId: string;
  readonly displayName: string;
  readonly version: string;
  readonly capabilities: readonly SkillCapability[];
  /**
   * When true, skill may perform side effects (files, network, desktop).
   * Execution must go through OpenClaw gateway with sandbox (Phase 10+).
   */
  readonly sideEffectCapable: boolean;
}
