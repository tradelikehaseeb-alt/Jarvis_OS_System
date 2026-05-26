import type {
  MemoryProvider,
  MemoryQuery,
  MemoryRecord,
  MemorySearchResult,
  MemoryStoreInput,
  RetrievalRequest,
  RetrievalResponse,
} from "@jarvis/types";

import type { MemoryServiceComponents, MemoryApiService } from "./contract";

/**
 * Delegates to wired components — no extra business rules (Phase 5).
 */
export class MemoryApiServiceStub implements MemoryApiService {
  readonly serviceId = "memory-service" as const;

  readonly provider: MemoryProvider;

  constructor(readonly components: MemoryServiceComponents) {
    this.provider = components.memoryProvider;
  }

  store(input: MemoryStoreInput): Promise<MemoryRecord> {
    return this.components.memoryProvider.store(input);
  }

  search(query: MemoryQuery): Promise<readonly MemorySearchResult[]> {
    return this.components.memoryProvider.search(query);
  }

  retrieve(request: RetrievalRequest): Promise<RetrievalResponse> {
    return this.components.retrievalEngine.retrieve(request);
  }
}
