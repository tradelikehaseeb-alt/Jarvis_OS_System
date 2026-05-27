/**
 * Conversation turn included in agent execution context (Phase 64).
 */
export interface ContextTurn {
  readonly role: string;
  readonly message: string;
  readonly timestamp: string;
  readonly taskId?: string;
  readonly intentKind?: string;
}

/**
 * Built execution context record for agent injection (Phase 64).
 */
export interface ContextRecord {
  readonly contextId: string;
  readonly userId: string;
  readonly conversationId?: string;
  readonly taskId?: string;
  readonly intentDescription?: string;
  readonly turns: readonly ContextTurn[];
  readonly summary: string;
  readonly builtAt: string;
  readonly source: "conversation-history" | "fallback";
}

/** Metadata key used when injecting context into {@link AgentContext}. */
export const JARVIS_CONTEXT_METADATA_KEY = "jarvisContext" as const;
