/**
 * Standard skill invocation outcome returned to the invoking agent.
 */
export interface SkillError {
  readonly code: string;
  readonly message: string;
  readonly details?: Readonly<Record<string, unknown>>;
}

export interface SkillOutput {
  readonly invocationId: string;
  readonly skillId: string;
  readonly success: boolean;
  readonly data?: Readonly<Record<string, unknown>>;
  readonly error?: SkillError;
}
