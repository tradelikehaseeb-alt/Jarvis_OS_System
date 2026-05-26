import { EmbeddingProviderStub } from "./embedding-provider/stub";
import { MemoryApiServiceStub } from "./memory-api/stub";
import type { MemoryServiceComponents } from "./memory-api/contract";
import type { MemoryApiService } from "./memory-api/contract";
import { MemoryProviderStub } from "./memory-provider/stub";
import { RetrievalEngineStub } from "./retrieval-engine/stub";
import { StorageAdapterStub } from "./storage-adapter/stub";

/**
 * Builds default stub components for the memory service (Phase 5).
 */
export function createStubMemoryComponents(): MemoryServiceComponents {
  const storageAdapter = new StorageAdapterStub();
  const embeddingProvider = new EmbeddingProviderStub();
  const memoryProvider = new MemoryProviderStub(storageAdapter, embeddingProvider);
  const retrievalEngine = new RetrievalEngineStub(storageAdapter);

  return {
    storageAdapter,
    embeddingProvider,
    memoryProvider,
    retrievalEngine,
  };
}

/**
 * Fully wired {@link MemoryApiService} using stub components.
 */
export function createMemoryService(): MemoryApiService {
  const components = createStubMemoryComponents();
  return new MemoryApiServiceStub(components);
}

/**
 * {@link MemoryApiService} with injected components (for tests and future DI).
 */
export function createMemoryServiceWith(
  components: MemoryServiceComponents,
): MemoryApiService {
  return new MemoryApiServiceStub(components);
}
