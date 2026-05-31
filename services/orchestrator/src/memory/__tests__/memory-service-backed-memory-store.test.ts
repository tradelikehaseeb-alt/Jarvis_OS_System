import { describe, expect, it } from "vitest";

import { MemoryServiceBackedMemoryStore } from "../memory-service-backed-memory-store";

describe("MemoryServiceBackedMemoryStore", () => {
  it("persists records to memory-service and serves from cache", () => {
    const store = new MemoryServiceBackedMemoryStore();
    const saved = store.saveRecord({
      recordId: "mem-test-1",
      type: "conversation",
      userId: "user-1",
      timestamp: new Date().toISOString(),
      conversationId: "conv-1",
      content: { message: "hello" },
    });

    expect(saved.recordId).toBe("mem-test-1");
    expect(store.getRecord("mem-test-1")?.content).toEqual({ message: "hello" });
    expect(
      store.queryHistory({ userId: "user-1", conversationId: "conv-1" }).length,
    ).toBeGreaterThan(0);
  });
});
