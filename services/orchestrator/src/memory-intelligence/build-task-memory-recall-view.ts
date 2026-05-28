import type { MemoryRecallRecord } from "../memory-recall/memory-recall-record";

export interface TaskMemoryRecallView {
  readonly count: number;
  readonly source: "conversation-history" | "fallback";
  readonly message?: string;
  readonly snippets?: readonly string[];
  readonly averageScore?: number;
}

/**
 * Builds user-facing memory recall summary for task output (Phase 93).
 */
export function buildTaskMemoryRecallView(
  recalledMemories: readonly MemoryRecallRecord[],
): TaskMemoryRecallView {
  const history = recalledMemories.filter(
    (memory) => memory.source === "conversation-history",
  );
  const source =
    history.length > 0 ? ("conversation-history" as const) : ("fallback" as const);

  const averageScore =
    history.length > 0
      ? history.reduce((sum, memory) => sum + memory.score, 0) / history.length
      : undefined;

  return {
    count: recalledMemories.length,
    source,
    message: history.length > 0 ? "Remembered context" : undefined,
    snippets: history.slice(0, 3).map((memory) => memory.content),
    averageScore,
  };
}
