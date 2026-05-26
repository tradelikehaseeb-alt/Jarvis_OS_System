import type { MemoryQuery } from "./memory-query";
import type { MemoryRecord } from "./memory-record";
import type { MemorySearchResult } from "./memory-search-result";

/**
 * Input to store a new memory record (server assigns id/timestamps in Phase 6+).
 */
export interface MemoryStoreInput {
  readonly userId: string;
  readonly content: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly embeddingRef?: string;
}

/**
 * Public memory provider contract — sole persistence API for agents (via gateway).
 */
export interface MemoryProvider {
  store(input: MemoryStoreInput): Promise<MemoryRecord>;
  get(recordId: string, userId: string): Promise<MemoryRecord | undefined>;
  search(query: MemoryQuery): Promise<readonly MemorySearchResult[]>;
}
