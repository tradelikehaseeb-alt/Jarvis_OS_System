/**
 * Runtime context supplied to an agent for a single invocation.
 *
 * Memory rule: agents must use Jarvis Memory Service HTTP APIs only.
 * Do not persist {@link AgentContext} or user memory inside agent processes.
 */
export interface AgentContext {
  /** Orchestrator session reference (from ContextManager). */
  readonly contextRef: string;
  readonly userId: string;
  /**
   * Opaque handle for memory API client configuration (Phase 9+).
   * Not a local memory store.
   */
  readonly memoryApiRef?: string;
  readonly correlationId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
