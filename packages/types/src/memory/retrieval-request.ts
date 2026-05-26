/**
 * Structured retrieval request for the retrieval engine.
 */
export interface RetrievalRequest {
  readonly requestId: string;
  readonly userId: string;
  readonly query: string;
  readonly topK?: number;
  readonly contextRef?: string;
}
