import { describe, expect, it } from "vitest";

import { createDefaultBrowserContextRuntime } from "../create-default-browser-context-runtime";

describe("BrowserContextRuntime", () => {
  it("initializes, updates, reads, and clears page context", async () => {
    const runtime = createDefaultBrowserContextRuntime();

    const initialized = await runtime.initializeContext("browser-session-1");
    expect(initialized.state).toBe("initialized");
    expect(initialized.sessionId).toBe("browser-session-1");
    expect(initialized.stub).toBe(true);
    expect(initialized.actionCount).toBe(0);

    const updated = await runtime.updateContext({
      currentUrl: "https://stub.local/dashboard",
      title: "[stub-title:https://stub.local/dashboard]",
      lastAction: "open-page",
    });
    expect(updated.state).toBe("active");
    expect(updated.currentUrl).toBe("https://stub.local/dashboard");
    expect(updated.actionCount).toBe(1);

    const current = runtime.getCurrentContext();
    expect(current?.currentUrl).toBe("https://stub.local/dashboard");
    expect(current?.lastAction).toBe("open-page");

    await runtime.clearContext();
    expect(runtime.getCurrentContext()).toBeUndefined();
  });

  it("stores snapshots when extract-content updates context", async () => {
    const runtime = createDefaultBrowserContextRuntime();
    await runtime.initializeContext("browser-session-2");

    const updated = await runtime.updateContext({
      activeSelector: "#status",
      extractedContent: "[stub-content:#status]",
      lastAction: "extract-content",
      appendSnapshot: true,
    });

    expect(updated.snapshots).toHaveLength(1);
    expect(updated.snapshots[0]?.extractedContent).toBe("[stub-content:#status]");
  });

  it("throws when updating uninitialized context", async () => {
    const runtime = createDefaultBrowserContextRuntime();

    await expect(
      runtime.updateContext({ currentUrl: "https://stub.local/page" }),
    ).rejects.toThrow("not initialized");
  });
});
