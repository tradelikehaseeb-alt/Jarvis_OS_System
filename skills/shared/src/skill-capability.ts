/**
 * Capability kind — what a skill provides to invoking agents.
 */
export type SkillCapabilityKind =
  | "read"
  | "write"
  | "search"
  | "transform"
  | "notify"
  | "integrate"
  | "automate";

/**
 * A single capability advertised on {@link SkillMetadata}.
 */
export interface SkillCapability {
  readonly id: string;
  readonly kind: SkillCapabilityKind;
  readonly description: string;
}
