import type { MemorySearchResult, RetrievalRequest, RetrievalResponse } from "@jarvis/types";

import type { StorageAdapter } from "../storage-adapter/contract";
import type { RetrievalEngine } from "./contract";

const STUB_SCORE = 0.5;

/**
 * Returns static ranked results from storage — no vector search (Phase 5).
 */
export class RetrievalEngineStub implements RetrievalEngine {
  readonly componentId = "retrieval-engine" as const;

  constructor(private readonly storage: StorageAdapter) {}

  async retrieve(request: RetrievalRequest): Promise<RetrievalResponse> {
    const records = await this.storage.listByUserId(request.userId);
    const results: MemorySearchResult[] = records.slice(0, request.topK ?? 10).map(
      (record) => ({
        record,
        score: STUB_SCORE,
      }),
    );

    return {
      requestId: request.requestId,
      results,
    };
  }
}
