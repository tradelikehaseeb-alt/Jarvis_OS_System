import type { RetrievalRequest, RetrievalResponse } from "@jarvis/types";

/**
 * Retrieval engine — semantic search orchestration (Phase 6+).
 */
export interface RetrievalEngine {
  readonly componentId: "retrieval-engine";
  retrieve(request: RetrievalRequest): Promise<RetrievalResponse>;
}
