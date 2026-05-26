import { beforeEach, describe, expect, it } from "vitest";

import { createMemoryService } from "../create-memory-service";
import { EmbeddingProviderStub } from "../embedding-provider/stub";
import { resetMockMemoryIdSequence } from "../internal/mock-ids";
import { MemoryProviderStub } from "../memory-provider/stub";
import { RetrievalEngineStub } from "../retrieval-engine/stub";
import { StorageAdapterStub } from "../storage-adapter/stub";

describe("StorageAdapterStub", () => {
  it("saves and loads records", async () => {
    const storage = new StorageAdapterStub();
    const record = {
      id: "mem-1",
      userId: "user-1",
      content: "note",
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    await storage.save(record);
    expect(await storage.load("mem-1", "user-1")).toEqual(record);
  });
});

describe("EmbeddingProviderStub", () => {
  it("returns static vector", async () => {
    const provider = new EmbeddingProviderStub();
    const vector = await provider.embed("hello");
    expect(vector).toEqual([0, 0, 0]);
  });
});

describe("MemoryProviderStub", () => {
  beforeEach(() => resetMockMemoryIdSequence());

  it("stores and retrieves memory", async () => {
    const storage = new StorageAdapterStub();
    const provider = new MemoryProviderStub(storage, new EmbeddingProviderStub());
    const stored = await provider.store({
      userId: "user-1",
      content: "Preference: dark mode",
    });
    expect(stored.embeddingRef).toContain("emb-ref-stub");
    const loaded = await provider.get(stored.id, "user-1");
    expect(loaded?.content).toBe("Preference: dark mode");
  });

  it("search returns stub scores", async () => {
    const storage = new StorageAdapterStub();
    const provider = new MemoryProviderStub(storage, new EmbeddingProviderStub());
    await provider.store({ userId: "user-1", content: "a" });
    const hits = await provider.search({ userId: "user-1", query: "a" });
    expect(hits).toHaveLength(1);
    expect(hits[0]?.score).toBe(0.75);
  });
});

describe("RetrievalEngineStub", () => {
  beforeEach(() => resetMockMemoryIdSequence());

  it("retrieve returns stored records for user", async () => {
    const storage = new StorageAdapterStub();
    const provider = new MemoryProviderStub(storage, new EmbeddingProviderStub());
    await provider.store({ userId: "user-1", content: "fact" });
    const engine = new RetrievalEngineStub(storage);
    const response = await engine.retrieve({
      requestId: "ret-1",
      userId: "user-1",
      query: "fact",
    });
    expect(response.requestId).toBe("ret-1");
    expect(response.results).toHaveLength(1);
  });
});

describe("MemoryApiService wiring", () => {
  beforeEach(() => resetMockMemoryIdSequence());

  it("createMemoryService exposes provider and components", () => {
    const service = createMemoryService();
    expect(service.serviceId).toBe("memory-service");
    expect(service.components.storageAdapter.componentId).toBe("storage-adapter");
    expect(service.provider).toBe(service.components.memoryProvider);
  });

  it("end-to-end store, search, retrieve", async () => {
    const service = createMemoryService();
    const stored = await service.store({
      userId: "user-1",
      content: "meeting at 3pm",
    });
    const search = await service.search({ userId: "user-1", query: "meeting" });
    const retrieve = await service.retrieve({
      requestId: "ret-2",
      userId: "user-1",
      query: "meeting",
    });
    expect(stored.id).toBeDefined();
    expect(search[0]?.record.id).toBe(stored.id);
    expect(retrieve.results.length).toBeGreaterThan(0);
  });
});
