import type { MemorySearchResult } from "./memory-search-result";

/**
 * Retrieval engine output — ranked memory hits.
 */
export interface RetrievalResponse {
  readonly requestId: string;
  readonly results: readonly MemorySearchResult[];
}
