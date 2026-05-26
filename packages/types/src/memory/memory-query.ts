/**
 * Search/query input for memory retrieval.
 */
export interface MemoryQuery {
  readonly userId: string;
  readonly query: string;
  readonly limit?: number;
  readonly filters?: Readonly<Record<string, unknown>>;
}
