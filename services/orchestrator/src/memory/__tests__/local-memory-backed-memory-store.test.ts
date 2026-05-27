import { describe, expect, it } from "vitest";

import { createDefaultLocalMemoryRuntime } from "@jarvis/local-memory";

import { LocalMemoryBackedMemoryStore } from "../local-memory-backed-memory-store";

describe("LocalMemoryBackedMemoryStore", () => {
  it("maps MemoryStore operations to LocalMemoryRuntime", () => {
    const runtime = createDefaultLocalMemoryRuntime({ useFileBackend: false });
    const store = new LocalMemoryBackedMemoryStore(runtime);

    store.saveRecord({
      recordId: "mem-1",
      type: "conversation",
      userId: "user-1",
      timestamp: new Date().toISOString(),
      conversationId: "conv-1",
      content: { message: "hello" },
    });

    expect(store.getRecord("mem-1")?.content.message).toBe("hello");
    expect(store.queryHistory({ userId: "user-1" })).toHaveLength(1);
    expect(store.deleteRecord("mem-1")).toBe(true);
    expect(store.getHealth().backend).toBe("memory");
  });
});
