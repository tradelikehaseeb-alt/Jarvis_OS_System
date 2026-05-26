/**
 * Runtime context for a skill invocation.
 *
 * Skills must not persist user memory locally — use Jarvis Memory Service APIs
 * via agent/orchestrator when memory is needed (Phase 10+).
 */
export interface SkillContext {
  readonly contextRef: string;
  readonly userId: string;
  readonly agentId: string;
  readonly workflowStepId?: string;
  /** Opaque memory API client ref — not a local store. */
  readonly memoryApiRef?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
