import type {
  MemoryProvider,
  MemoryQuery,
  MemoryRecord,
  MemorySearchResult,
  MemoryStoreInput,
  RetrievalRequest,
  RetrievalResponse,
} from "@jarvis/types";

import type { EmbeddingProvider } from "../embedding-provider/contract";
import type { MemoryProviderComponent } from "../memory-provider/contract";
import type { RetrievalEngine } from "../retrieval-engine/contract";
import type { StorageAdapter } from "../storage-adapter/contract";

/**
 * Composed memory service components (internal wiring).
 */
export interface MemoryServiceComponents {
  readonly storageAdapter: StorageAdapter;
  readonly embeddingProvider: EmbeddingProvider;
  readonly memoryProvider: MemoryProviderComponent;
  readonly retrievalEngine: RetrievalEngine;
}

/**
 * Unified memory API surface for api-gateway and Hermes (via HTTP later).
 */
export interface MemoryApiService {
  readonly serviceId: "memory-service";
  readonly components: MemoryServiceComponents;
  readonly provider: MemoryProvider;
  store(input: MemoryStoreInput): Promise<MemoryRecord>;
  search(query: MemoryQuery): Promise<readonly MemorySearchResult[]>;
  retrieve(request: RetrievalRequest): Promise<RetrievalResponse>;
}
