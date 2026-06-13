import { afterEach, describe, expect, it } from "vitest";

import { createMemoryService, createMemoryComponents } from "../create-memory-service";
import { resetSharedJarvisMemoryClient } from "../jarvis-memory-client";
import { InMemoryJarvisStorageAdapter } from "../storage-adapter/in-memory-jarvis-storage-adapter";

describe("InMemoryJarvisStorageAdapter", () => {
  afterEach(() => {
    resetSharedJarvisMemoryClient();
  });

  it("createMemoryComponents uses in-memory when JARVIS_MEMORY_BACKEND=local", () => {
    const components = createMemoryComponents({
      env: { JARVIS_MEMORY_BACKEND: "local", NODE_ENV: "development" },
    });
    expect(components.storageAdapter).toBeInstanceOf(InMemoryJarvisStorageAdapter);
    expect(components.storageAdapter.databasePath).toBe("memory://in-memory");
  });

  it("createMemoryService stores and searches without better-sqlite3", async () => {
    const service = createMemoryService({
      env: { JARVIS_MEMORY_BACKEND: "local", NODE_ENV: "development" },
    });
    await service.saveMemoryContent("user-1", "Jarvis desktop memory test", "fact");
    const hits = await service.searchMemories("user-1", "desktop", 5);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]?.record.content).toContain("desktop");
  });
});
