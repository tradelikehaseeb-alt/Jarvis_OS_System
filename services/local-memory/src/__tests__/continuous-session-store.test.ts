import { describe, expect, it } from "vitest";

import { createDefaultLocalMemoryRuntime } from "./create-default-local-memory-runtime";
import {
  loadContinuousSession,
  saveContinuousSession,
  listContinuousSessions,
} from "./continuous-session-store";

describe("continuous session store", () => {
  it("persists and loads continuous sessions", () => {
    const runtime = createDefaultLocalMemoryRuntime();
    const session = saveContinuousSession(runtime, {
      sessionId: "cont-1",
      userId: "user-1",
      conversationId: "conv-1",
      presence: "background",
      backgroundTaskCount: 2,
      state: "active",
      updatedAt: new Date().toISOString(),
    });

    expect(loadContinuousSession(runtime, "user-1", "cont-1")?.sessionId).toBe(session.sessionId);
    expect(listContinuousSessions(runtime, "user-1").length).toBe(1);
  });
});
