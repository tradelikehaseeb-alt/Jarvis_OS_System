import type { MemoryRecord } from "./memory-record";

/**
 * Ranked memory hit from search or retrieval.
 */
export interface MemorySearchResult {
  readonly record: MemoryRecord;
  /** Relevance score 0–1 (stub values in Phase 5). */
  readonly score: number;
}
