import { describe, expect, it } from "vitest";

import { createDefaultLocalMemoryRuntime } from "../create-default-local-memory-runtime";
import {
  loadProductivitySession,
  saveProductivitySession,
  listProductivitySessions,
} from "../productivity-session-store";

describe("productivity session store", () => {
  it("persists and loads productivity sessions", () => {
    const runtime = createDefaultLocalMemoryRuntime();
    const session = saveProductivitySession(runtime, {
      sessionId: "prod-1",
      userId: "user-1",
      conversationId: "conv-1",
      focus: "Email priorities",
      taskCount: 3,
      state: "active",
      updatedAt: new Date().toISOString(),
    });

    expect(loadProductivitySession(runtime, "user-1", "prod-1")?.sessionId).toBe(
      session.sessionId,
    );
    expect(listProductivitySessions(runtime, "user-1").length).toBe(1);
  });
});
