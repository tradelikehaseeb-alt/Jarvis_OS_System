import { describe, expect, it } from "vitest";

import { createDefaultBrowserRuntimeBootstrap } from "../create-default-browser-runtime-bootstrap";
import { DefaultBrowserRuntimeValidator } from "../browser-runtime-validator";

describe("BrowserRuntimeBootstrap", () => {
  it("initializes, validates, creates session, and terminates runtime", async () => {
    const bootstrap = createDefaultBrowserRuntimeBootstrap();

    const initialized = await bootstrap.initializeRuntime();
    expect(initialized.state).toBe("idle");
    expect(initialized.sessionId).toMatch(/^browser-bootstrap-/);
    expect(initialized.stub).toBe(true);

    const health = await bootstrap.validateRuntime();
    expect(health.valid).toBe(true);
    expect(health.stub).toBe(true);
    expect(health.message).toContain("bootstrap");

    const { info, session } = await bootstrap.createSession();
    expect(info.sessionId).toMatch(/^browser-session-/);
    expect(session.sessionId).toBe(info.sessionId);

    const terminated = await bootstrap.terminateRuntime();
    expect(terminated.state).toBe("terminated");
    expect(terminated.terminatedAt).toBeDefined();
  });

  it("uses custom validator and config", async () => {
    const bootstrap = createDefaultBrowserRuntimeBootstrap({
      config: {
        stub: true,
        sessionIdPrefix: "custom-bootstrap",
        sandbox: true,
      },
      validator: new DefaultBrowserRuntimeValidator(),
    });

    const initialized = await bootstrap.initializeRuntime();
    expect(initialized.sessionId).toMatch(/^custom-bootstrap-/);

    const health = await bootstrap.validateRuntime();
    expect(health.valid).toBe(true);
  });
});
