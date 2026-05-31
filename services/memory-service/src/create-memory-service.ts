import { EmbeddingProviderStub, TfidfEmbeddingProvider } from "./embedding-provider/stub";
import { DefaultMemoryApiService } from "./memory-api/default-memory-api-service";
import { MemoryApiServiceStub } from "./memory-api/memory-api-legacy";
import type { MemoryServiceComponents } from "./memory-api/contract";
import type { MemoryApiService } from "./memory-api/contract";
import { DefaultMemoryProvider } from "./memory-provider/default-memory-provider";
import { MemoryProviderStub } from "./memory-provider/memory-provider-legacy";
import { DefaultRetrievalEngine } from "./retrieval-engine/default-retrieval-engine";
import { RetrievalEngineStub } from "./retrieval-engine/retrieval-engine-legacy";
import { useMemoryStubComponents } from "./internal/memory-component-policy";
import {
  createSqliteStorageAdapter,
  StorageAdapterStub,
  type SqliteStorageAdapter,
} from "./storage-adapter/stub";

export interface CreateMemoryServiceOptions {
  readonly dbPath?: string;
  readonly env?: Readonly<Record<string, string | undefined>>;
  readonly storageAdapter?: SqliteStorageAdapter;
}

/**
 * Real SQLite-backed memory components (default for production).
 */
export function createMemoryComponents(
  options: CreateMemoryServiceOptions = {},
): MemoryServiceComponents {
  const storageAdapter =
    options.storageAdapter ??
    createSqliteStorageAdapter({
      dbPath: options.dbPath,
      env: options.env ?? process.env,
    });
  const embeddingProvider = new TfidfEmbeddingProvider();
  const memoryProvider = new DefaultMemoryProvider(
    storageAdapter,
    embeddingProvider,
  );
  const retrievalEngine = new DefaultRetrievalEngine(
    storageAdapter,
    embeddingProvider,
  );

  return {
    storageAdapter,
    embeddingProvider,
    memoryProvider,
    retrievalEngine,
  };
}

/** Legacy stub components — `MEMORY_FORCE_STUB_COMPONENTS=true` in test only. */
export function createLegacyStubMemoryComponents(): MemoryServiceComponents {
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
 * @deprecated Use {@link createMemoryComponents}. Returns stubs only when forced in test.
 */
export function createStubMemoryComponents(
  options: CreateMemoryServiceOptions = {},
): MemoryServiceComponents {
  if (useMemoryStubComponents(options.env)) {
    return createLegacyStubMemoryComponents();
  }
  return createMemoryComponents(options);
}

/**
 * Fully wired {@link MemoryApiService} with SQLite persistence.
 */
export function createMemoryService(
  options: CreateMemoryServiceOptions = {},
): MemoryApiService {
  const components = createStubMemoryComponents(options);
  if (useMemoryStubComponents(options.env)) {
    return new MemoryApiServiceStub(components);
  }
  return new DefaultMemoryApiService(components);
}

/**
 * {@link MemoryApiService} with injected components.
 */
export function createMemoryServiceWith(
  components: MemoryServiceComponents,
): MemoryApiService {
  if (useMemoryStubComponents()) {
    return new MemoryApiServiceStub(components);
  }
  return new DefaultMemoryApiService(components);
}
