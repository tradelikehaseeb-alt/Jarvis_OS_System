import { describe, expect, it } from "vitest";

import { createDefaultLocalMemoryRuntime } from "../index";
import { loadRuntimeCheckpoint, saveRuntimeCheckpoint } from "../runtime-checkpoint";

describe("runtime checkpoint", () => {
  it("persists and loads checkpoint records", () => {
    const runtime = createDefaultLocalMemoryRuntime({ useFileBackend: false });
    saveRuntimeCheckpoint(runtime, {
      checkpointId: "cp-1",
      userId: "user-1",
      sessionId: "ws-1",
      conversationId: "conv-1",
      pendingTaskId: "task-1",
      savedAt: new Date().toISOString(),
    });

    const loaded = loadRuntimeCheckpoint(runtime, "ws-1");
    expect(loaded?.pendingTaskId).toBe("task-1");
  });
});
