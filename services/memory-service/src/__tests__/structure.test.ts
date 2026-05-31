import { describe, expect, it } from "vitest";

import {
  MEMORY_SERVICE_MODULE_IDS,
  MemoryApiServiceStub,
  MemoryProviderStub,
  createMemoryService,
  createStubMemoryComponents,
} from "../index";
import { DefaultMemoryProvider } from "../memory-provider/default-memory-provider";
import { EmbeddingProviderStub } from "../embedding-provider/stub";
import { TfidfEmbeddingProvider } from "../embedding-provider/tfidf-embedding-provider";
import { StorageAdapterStub } from "../storage-adapter/stub";
import { SqliteStorageAdapter } from "../storage-adapter/sqlite-storage-adapter";

describe("memory-service structure", () => {
  it("declares five core modules", () => {
    expect(MEMORY_SERVICE_MODULE_IDS).toEqual([
      "memory-provider",
      "retrieval-engine",
      "embedding-provider",
      "storage-adapter",
      "memory-api",
    ]);
  });

  it("createMemoryService wires real SQLite components by default", () => {
    const service = createMemoryService();
    expect(service.components.memoryProvider).toBeInstanceOf(DefaultMemoryProvider);
    expect(service.components.embeddingProvider).toBeInstanceOf(
      TfidfEmbeddingProvider,
    );
    expect(service.components.storageAdapter).toBeInstanceOf(
      SqliteStorageAdapter,
    );
  });

  it("createMemoryService can force legacy stubs in test", () => {
    process.env.MEMORY_FORCE_STUB_COMPONENTS = "true";
    process.env.NODE_ENV = "test";
    const service = createMemoryService();
    expect(service.components.memoryProvider).toBeInstanceOf(MemoryProviderStub);
    expect(service.components.embeddingProvider).toBeInstanceOf(
      EmbeddingProviderStub,
    );
    expect(service.components.storageAdapter).toBeInstanceOf(StorageAdapterStub);
    delete process.env.MEMORY_FORCE_STUB_COMPONENTS;
  });

  it("MemoryApiServiceStub accepts injected components", () => {
    process.env.MEMORY_FORCE_STUB_COMPONENTS = "true";
    process.env.NODE_ENV = "test";
    const components = createStubMemoryComponents();
    const service = new MemoryApiServiceStub(components);
    expect(service.provider).toBe(components.memoryProvider);
    delete process.env.MEMORY_FORCE_STUB_COMPONENTS;
  });
});
