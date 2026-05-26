import { describe, expect, it } from "vitest";

import {
  MEMORY_SERVICE_MODULE_IDS,
  MemoryApiServiceStub,
  MemoryProviderStub,
  createMemoryService,
  createStubMemoryComponents,
} from "../index";
import { EmbeddingProviderStub } from "../embedding-provider/stub";
import { StorageAdapterStub } from "../storage-adapter/stub";

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

  it("createMemoryService wires stub component classes", () => {
    const service = createMemoryService();
    expect(service.components.memoryProvider).toBeInstanceOf(MemoryProviderStub);
    expect(service.components.embeddingProvider).toBeInstanceOf(EmbeddingProviderStub);
    expect(service.components.storageAdapter).toBeInstanceOf(StorageAdapterStub);
  });

  it("MemoryApiServiceStub accepts injected components", () => {
    const components = createStubMemoryComponents();
    const service = new MemoryApiServiceStub(components);
    expect(service.provider).toBe(components.memoryProvider);
  });
});
