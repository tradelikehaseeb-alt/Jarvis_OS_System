/**
 * @jarvis/skills-shared — common skills framework (Phase 9).
 * Interfaces and abstract base only — no agents, automation, or HTTP.
 */

export type { SkillCapability, SkillCapabilityKind } from "./skill-capability";
export type { SkillMetadata } from "./skill-metadata";
export type { SkillInput } from "./skill-input";
export type { SkillError, SkillOutput } from "./skill-output";
export type { SkillContext } from "./skill-context";
export type { BaseSkill } from "./base-skill";
export { AbstractBaseSkill } from "./base-skill";
export type { SkillRegistry } from "./skill-registry";
export { InMemorySkillRegistry } from "./in-memory-skill-registry";
