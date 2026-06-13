import { describe, expect, it } from "vitest";

import {
  createDefaultBrowserExecutionRuntime,
  createDefaultExecutionPermissionManager,
  createDefaultExecutionSafetyRuntime,
  parseBrowserIntent,
} from "../index";

describe("parseBrowserIntent", () => {
  it("builds Gmail summarize workflow steps", () => {
    const parsed = parseBrowserIntent("Open Gmail and summarize unread emails");
    expect(parsed.url).toContain("mail.google.com");
    expect(parsed.workflowSteps.length).toBeGreaterThan(1);
  });

  it("returns native runtimeResult for YouTube intents", () => {
    const parsed = parseBrowserIntent("play relaxing music on youtube");
    expect(parsed.url).toBe("https://www.youtube.com");
    expect(parsed.action).toBe("open");
    expect(parsed.runtimeResult).toMatchObject({
      success: true,
      nativeOpen: true,
      stub: false,
      action: "open",
      url: "https://www.youtube.com",
    });
  });

  it("maps close window intents to close_window", () => {
    const parsed = parseBrowserIntent("close the browser window");
    expect(parsed.action).toBe("close_window");
    expect(parsed.runtimeResult).toMatchObject({
      success: true,
      action: "close_window",
      nativeOpen: true,
    });
  });

  it("returns native runtimeResult for explicit URLs", () => {
    const parsed = parseBrowserIntent("open https://example.com/docs");
    expect(parsed.runtimeResult).toMatchObject({
      success: true,
      nativeOpen: true,
      url: "https://example.com/docs",
    });
  });

  it("omits runtimeResult for stub fallback URLs", () => {
    const parsed = parseBrowserIntent("do something vague");
    expect(parsed.url).toContain("stub.local");
    expect(parsed.runtimeResult).toBeUndefined();
  });
});

describe("ExecutionPermissionManager", () => {
  it("requires confirmation for external domains", () => {
    const manager = createDefaultExecutionPermissionManager();
    const decision = manager.evaluate({
      action: "open-page",
      url: "https://unknown-example.test",
    });
    expect(decision.requiresConfirmation).toBe(true);
  });
});

describe("BrowserExecutionRuntime", () => {
  it("executes stub browser workflow", async () => {
    const runtime = createDefaultBrowserExecutionRuntime({ stub: true });
    const result = await runtime.execute({
      taskId: "task-1",
      requestId: "req-1",
      action: "workflow",
      url: "https://mail.google.com",
      workflowSteps: [
        { action: "open-page", url: "https://mail.google.com" },
        { action: "extract-content", selector: "body" },
      ],
      stub: true,
    });

    expect(result.success).toBe(true);
    expect(result.browserState?.url).toContain("mail.google.com");
    expect(result.workflowProgress?.length).toBe(2);
  });
});

describe("ExecutionSafetyRuntime", () => {
  it("detects action loops", () => {
    const safety = createDefaultExecutionSafetyRuntime();
    const startedAt = new Date().toISOString();

    for (let index = 0; index < 6; index += 1) {
      safety.recordAction("open-page:https://example.com");
    }

    const decision = safety.evaluate({ stepCount: 7, startedAt });
    expect(decision.loopDetected).toBe(true);
    expect(decision.allowed).toBe(false);
  });
});
