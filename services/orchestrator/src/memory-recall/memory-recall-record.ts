/**
 * Recalled memory item for conversation flow injection (Phase 66).
 */
export interface MemoryRecallRecord {
  readonly recallId: string;
  readonly userId: string;
  readonly conversationId?: string;
  readonly taskId?: string;
  readonly content: string;
  readonly role: string;
  readonly score: number;
  readonly source: "conversation-history" | "fallback";
  readonly recalledAt: string;
}

/** Metadata key for injected memory recall on {@link AgentContext}. */
export const JARVIS_MEMORY_RECALL_METADATA_KEY = "jarvisMemoryRecall" as const;
