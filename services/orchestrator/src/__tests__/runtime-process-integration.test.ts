import { describe, expect, it } from "vitest";

import {
  createDefaultRuntimeProcessManager,
  DEFAULT_RUNTIME_PROCESS_IDS,
} from "@jarvis/runtime-process";

describe("Orchestrator runtime process integration", () => {
  it("starts orchestrator and agent runtime processes deterministically", async () => {
    const manager = createDefaultRuntimeProcessManager();

    await manager.startProcess("orchestrator");
    await manager.startProcess("hermes-runtime");
    await manager.startProcess("openclaw-runtime");

    const orchestrator = manager.getProcess("orchestrator");
    const hermes = manager.getProcess("hermes-runtime");
    const openclaw = manager.getProcess("openclaw-runtime");

    expect(orchestrator?.state).toBe("running");
    expect(hermes?.state).toBe("running");
    expect(openclaw?.state).toBe("running");

    const health = manager.getHealth();
    expect(health.runningCount).toBe(3);
    expect(health.processCount).toBe(DEFAULT_RUNTIME_PROCESS_IDS.length);
  });
});
