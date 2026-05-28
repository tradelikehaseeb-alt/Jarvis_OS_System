import type { AgentContext } from "@jarvis/agents-shared";

/** User-facing recalled context passed to Hermes planning (Phase 93). */
export interface HermesRecalledContext {
  readonly count: number;
  readonly snippets: readonly string[];
}

/**
 * Extracts recalled context from orchestrator agent metadata (Phase 93).
 */
export function extractRecalledContextFromAgentContext(
  context: AgentContext,
): HermesRecalledContext | undefined {
  const recall = context.metadata?.jarvisMemoryRecall;
  if (!Array.isArray(recall)) {
    return undefined;
  }

  const history = recall.filter(
    (entry): entry is { content: string; source: string } =>
      typeof entry === "object" &&
      entry !== null &&
      "content" in entry &&
      "source" in entry &&
      (entry as { source: string }).source === "conversation-history" &&
      typeof (entry as { content: string }).content === "string",
  );

  if (history.length === 0) {
    return undefined;
  }

  return {
    count: history.length,
    snippets: history.slice(0, 3).map((entry) => entry.content),
  };
}
