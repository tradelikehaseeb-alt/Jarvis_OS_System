import { describe, expect, it } from "vitest";

import { createDefaultLocalMemoryRuntime } from "./create-default-local-memory-runtime";
import { saveContinuousSession, listContinuousSessions } from "./continuous-session-store";

describe("real-world long session memory continuity", () => {
  it("persists continuous sessions across long-running validation", () => {
    const runtime = createDefaultLocalMemoryRuntime();

    saveContinuousSession(runtime, {
      sessionId: "rw-long-1",
      userId: "user-rw",
      conversationId: "conv-rw-long",
      presence: "background",
      backgroundTaskCount: 3,
      state: "active",
      updatedAt: new Date().toISOString(),
    });

    expect(listContinuousSessions(runtime, "user-rw").length).toBe(1);
  });
});
