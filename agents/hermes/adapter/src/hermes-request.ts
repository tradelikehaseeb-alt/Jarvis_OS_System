import type { TaskIntent } from "@jarvis/types";

/**
 * Input to {@link HermesAdapter.invoke} — planning/reasoning boundary (Phase 16).
 *
 * Built from orchestrator {@link AgentTask} data; no LLM payloads here.
 */
export interface HermesRequest {
  readonly requestId: string;
  readonly taskId: string;
  readonly userId: string;
  readonly intent: TaskIntent;
  readonly contextRef?: string;
  readonly correlationId?: string;
  readonly workflowStepId?: string;
  /** Recalled conversation snippets from orchestrator memory (Phase 93). */
  readonly recalledContextSnippets?: readonly string[];
  /** Structured conversation turns for multi-turn Hermes chat. */
  readonly conversationTurns?: readonly {
    readonly role: "user" | "assistant" | "system";
    readonly message: string;
  }[];
}
