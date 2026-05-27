import { describe, expect, it } from "vitest";

import { StorageBackedMemoryStore } from "../storage-backed-memory-store";
import { createDefaultStorageRuntime } from "../../storage-runtime/create-default-storage-runtime";

describe("StorageBackedMemoryStore", () => {
  it("delegates save and query to storage runtime", () => {
    const store = new StorageBackedMemoryStore(createDefaultStorageRuntime());

    store.saveRecord({
      recordId: "mem-1",
      type: "conversation",
      userId: "user-1",
      timestamp: "2026-01-01T00:00:01.000Z",
      conversationId: "conv-1",
      content: { message: "hello", role: "user" },
    });
    store.saveRecord({
      recordId: "mem-2",
      type: "execution",
      userId: "user-1",
      timestamp: "2026-01-01T00:00:02.000Z",
      taskId: "task-1",
      content: { state: "completed" },
    });

    expect(store.getRecord("mem-1")?.content.message).toBe("hello");

    const conversation = store.queryHistory({
      userId: "user-1",
      types: ["conversation"],
    });
    expect(conversation).toHaveLength(1);

    const limited = store.queryHistory({ userId: "user-1", limit: 1 });
    expect(limited).toHaveLength(1);
    expect(limited[0]?.recordId).toBe("mem-2");
  });
});
