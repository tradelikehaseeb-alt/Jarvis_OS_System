import type {
  MemoryQuery,
  MemoryRecord,
  MemorySearchResult,
  MemoryStoreInput,
  RetrievalRequest,
  RetrievalResponse,
} from "@jarvis/types";

import type { MemoryServiceComponents, MemoryApiService } from "./contract";

/** Legacy API delegate — test-only. */
export class MemoryApiServiceStub implements MemoryApiService {
  readonly serviceId = "memory-service" as const;

  readonly provider: MemoryApiService["provider"];

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
