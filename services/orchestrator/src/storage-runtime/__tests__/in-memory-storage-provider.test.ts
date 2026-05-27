import { describe, expect, it } from "vitest";

import { InMemoryStorageProvider } from "../in-memory-storage-provider";

describe("InMemoryStorageProvider", () => {
  it("saves, gets, queries, and deletes records", () => {
    const provider = new InMemoryStorageProvider();

    provider.save({
      id: "rec-1",
      namespace: "test",
      timestamp: "2026-01-01T00:00:01.000Z",
      data: { value: "alpha" },
      metadata: { userId: "user-1", type: "conversation" },
    });
    provider.save({
      id: "rec-2",
      namespace: "test",
      timestamp: "2026-01-01T00:00:02.000Z",
      data: { value: "beta" },
      metadata: { userId: "user-1", type: "execution" },
    });
    provider.save({
      id: "rec-3",
      namespace: "other",
      timestamp: "2026-01-01T00:00:03.000Z",
      data: { value: "gamma" },
      metadata: { userId: "user-2" },
    });

    expect(provider.get("rec-1", "test")?.data.value).toBe("alpha");

    const filtered = provider.query({
      namespace: "test",
      filter: { userId: "user-1", type: "conversation" },
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("rec-1");

    const limited = provider.query({
      namespace: "test",
      filter: { userId: "user-1" },
      limit: 1,
    });
    expect(limited).toHaveLength(1);
    expect(limited[0]?.id).toBe("rec-2");

    expect(provider.delete("rec-1", "test")).toBe(true);
    expect(provider.get("rec-1", "test")).toBeUndefined();
  });

  it("reports healthy status with record count", () => {
    const provider = new InMemoryStorageProvider();
    provider.save({
      id: "rec-1",
      namespace: "test",
      timestamp: "2026-01-01T00:00:00.000Z",
      data: {},
    });

    const health = provider.getHealth();
    expect(health.status).toBe("healthy");
    expect(health.recordCount).toBe(1);
    expect(health.providerId).toBe("in-memory");
  });
});
