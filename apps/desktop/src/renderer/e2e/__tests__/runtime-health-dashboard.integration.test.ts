import { afterEach, describe, expect, it } from "vitest";

import {
  createDefaultRuntimeHealthRuntime,
  createDefaultRuntimeStartupManager,
} from "@jarvis/orchestrator";
import {
  createDefaultRuntimeProcessManager,
} from "@jarvis/runtime-process";

describe("Desktop runtime health dashboard integration", () => {
  afterEach(() => {
    /* no shared state */
  });

  it("aggregates Hermes, OpenClaw, Speech, and Memory for dashboard display", async () => {
    const manager = createDefaultRuntimeProcessManager();
    const startup = createDefaultRuntimeStartupManager({ processManager: manager });
    const healthRuntime = createDefaultRuntimeHealthRuntime({
      processManager: manager,
      startupManager: startup,
      getMemoryHealth: () => ({ healthy: true, message: "Memory ready" }),
      getSpeechHealth: () => ({ healthy: true, message: "Speech ready" }),
    });

    await startup.initializeRuntime();
    const health = await healthRuntime.refresh();
    const progress = healthRuntime.getStartupProgress();

    expect(health.components.find((c) => c.componentId === "hermes")?.healthy).toBe(
      true,
    );
    expect(health.components.find((c) => c.componentId === "openclaw")?.healthy).toBe(
      true,
    );
    expect(health.components.find((c) => c.componentId === "speech")?.healthy).toBe(
      true,
    );
    expect(health.components.find((c) => c.componentId === "memory")?.healthy).toBe(
      true,
    );
    expect(progress.ready).toBe(true);
    expect(progress.percent).toBe(100);
  });
});
