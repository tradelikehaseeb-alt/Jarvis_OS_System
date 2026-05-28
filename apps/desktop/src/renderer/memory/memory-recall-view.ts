export { MemoryContextIndicator, type MemoryContextIndicatorProps } from "./MemoryContextIndicator";

export interface MemoryRecallView {
  readonly count?: number;
  readonly source?: string;
  readonly message?: string;
  readonly snippets?: readonly string[];
}

/** Parses task output memory recall for UI (Phase 93). */
export function parseMemoryRecallView(
  output: Record<string, unknown> | undefined,
): MemoryRecallView | undefined {
  const recall = output?.memoryRecall;
  if (!recall || typeof recall !== "object") {
    return undefined;
  }
  const view = recall as MemoryRecallView;
  return view.count ? view : undefined;
}
