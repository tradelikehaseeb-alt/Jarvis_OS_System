/**
 * Embedding generation port — model integration in Phase 6+.
 */
export interface EmbeddingProvider {
  readonly componentId: "embedding-provider";
  /** Returns a stub vector; no model invocation in Phase 5. */
  embed(text: string): Promise<readonly number[]>;
}
