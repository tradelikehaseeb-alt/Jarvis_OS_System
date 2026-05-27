import { describe, expect, it } from "vitest";

import {
  createBrowserRuntimeSession,
  createDefaultBrowserActionPipeline,
  createDefaultBrowserContextRuntime,
} from "../index";

const baseRequest = {
  taskId: "task-context-int-1",
  requestId: "req-context-int-1",
  stub: true,
};

describe("Browser context runtime integration", () => {
  it("maintains page state across pipeline actions", async () => {
    const contextRuntime = createDefaultBrowserContextRuntime();
    const pipeline = createDefaultBrowserActionPipeline({ contextRuntime });

    await pipeline.executePipeline([
      {
        ...baseRequest,
        action: "open-page",
        url: "https://stub.local/dashboard",
      },
      {
        ...baseRequest,
        action: "click-element",
        selector: "#submit",
      },
      {
        ...baseRequest,
        action: "extract-content",
        selector: "#status",
      },
    ]);

    const context = contextRuntime.getCurrentContext();
    expect(context?.currentUrl).toBe("https://stub.local/dashboard");
    expect(context?.activeSelector).toBe("#status");
    expect(context?.actionCount).toBe(3);
    expect(context?.snapshots).toHaveLength(1);
  });

  it("initializes and clears context through browser session lifecycle", async () => {
    const contextRuntime = createDefaultBrowserContextRuntime();
    const session = createBrowserRuntimeSession({ contextRuntime });

    await session.initializeSession();
    expect(contextRuntime.getCurrentContext()?.sessionId).toBe(session.sessionId);

    await session.validateBrowser();
    const result = await session.executeBrowserTask({
      taskId: "task-context-int-2",
      requestId: "req-context-int-2",
      action: "navigate",
      url: "https://stub.local/task",
      stub: true,
    });

    expect(result.success).toBe(true);
    expect(contextRuntime.getCurrentContext()?.currentUrl).toBe(
      "https://stub.local/task",
    );

    await session.terminateSession();
    expect(contextRuntime.getCurrentContext()).toBeUndefined();
  });
});
