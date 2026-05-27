import { describe, expect, it } from "vitest";

import {
  createDefaultStorageRuntime,
  createFileStorageRuntime,
} from "../create-default-storage-runtime";
import { StorageProviderRegistry } from "../storage-provider-registry";
import { InMemoryStorageProvider } from "../in-memory-storage-provider";
import { FileStorageProvider } from "../file-storage-provider";

describe("StorageRuntime", () => {
  it("routes save/get/query/delete through default provider", () => {
    const runtime = createDefaultStorageRuntime();

    runtime.save({
      id: "r1",
      namespace: "ns",
      timestamp: "2026-01-01T00:00:00.000Z",
      data: { hello: "world" },
      metadata: { userId: "u1" },
    });

    expect(runtime.get("r1", "ns")?.data.hello).toBe("world");
    expect(runtime.query({ namespace: "ns", filter: { userId: "u1" } })).toHaveLength(
      1,
    );
    expect(runtime.delete("r1", "ns")).toBe(true);
    expect(runtime.getHealth().status).toBe("healthy");
    expect(runtime.getDefaultProviderId()).toBe("in-memory");
  });

  it("supports registry with multiple providers", () => {
    const registry = new StorageProviderRegistry(new InMemoryStorageProvider());
    registry.register(new FileStorageProvider("/tmp/unused-test.json"));

    expect(registry.listProviderIds()).toEqual(["in-memory", "file"]);
    expect(registry.getHealth("in-memory").providerId).toBe("in-memory");
  });

  it("createFileStorageRuntime uses file provider as default", () => {
    const runtime = createFileStorageRuntime("/tmp/jarvis-storage-runtime-test.json");
    expect(runtime.getDefaultProviderId()).toBe("file");
    expect(runtime.listProviderIds()).toContain("in-memory");
  });
});
