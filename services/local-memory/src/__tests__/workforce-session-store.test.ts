import { describe, expect, it } from "vitest";

import { createDefaultLocalMemoryRuntime } from "../create-default-local-memory-runtime";
import {
  loadWorkforceSession,
  saveWorkforceSession,
  listWorkforceSessions,
} from "../workforce-session-store";

describe("workforce session store", () => {
  it("persists and loads workforce sessions", () => {
    const runtime = createDefaultLocalMemoryRuntime();
    const session = saveWorkforceSession(runtime, {
      sessionId: "wf-1",
      userId: "user-1",
      conversationId: "conv-1",
      workerTypes: ["research", "market", "document"],
      state: "active",
      updatedAt: new Date().toISOString(),
    });

    expect(loadWorkforceSession(runtime, "user-1", "wf-1")?.sessionId).toBe(session.sessionId);
    expect(listWorkforceSessions(runtime, "user-1").length).toBe(1);
  });
});
