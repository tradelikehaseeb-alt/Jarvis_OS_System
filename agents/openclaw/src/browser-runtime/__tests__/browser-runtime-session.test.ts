import { describe, expect, it } from "vitest";

import { createBrowserRuntimeSession } from "../create-browser-runtime-session";

const request = {
  taskId: "task-browser-1",
  requestId: "req-browser-1",
  action: "navigate",
  url: "https://stub.local/task",
  handleId: "handle-stub-task-browser-1",
  stub: true,
};

describe("BrowserRuntimeSession", () => {
  it("initializes, validates, executes stub task, and terminates", async () => {
    const session = createBrowserRuntimeSession();

    const initialized = await session.initializeSession();
    expect(initialized.state).toBe("idle");
    expect(initialized.sessionId).toMatch(/^browser-session-/);

    const health = await session.validateBrowser();
    expect(health.valid).toBe(true);
    expect(health.stub).toBe(true);

    const result = await session.executeBrowserTask(request);
    expect(result.success).toBe(true);
    expect(result.status).toBe("completed");
    expect(result.message).toContain("stub-executed");

    const terminated = await session.terminateSession();
    expect(terminated.state).toBe("terminated");
  });
});
