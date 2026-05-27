/**
 * Query filters for {@link StorageProvider.query} (Phase 51).
 */
export interface StorageQuery {
  readonly namespace?: string;
  readonly filter?: Readonly<Record<string, unknown>>;
  readonly limit?: number;
  readonly sort?: "asc" | "desc";
}
