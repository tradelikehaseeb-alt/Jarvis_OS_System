import { describe, expect, it } from "vitest";

import {
  createDefaultRuntimeProcessManager,
  DEFAULT_RUNTIME_PROCESS_IDS,
} from "../index";

describe("Runtime process manager integration", () => {
  it("models Desktop → API Runtime → Process Manager → Orchestrator flow", async () => {
    const started: string[] = [];
    const stopped: string[] = [];

    const manager = createDefaultRuntimeProcessManager({
      processHandlers: {
        "api-runtime": {
          start: async () => {
            started.push("api-runtime");
          },
          stop: async () => {
            stopped.push("api-runtime");
          },
        },
        orchestrator: {
          start: async () => {
            started.push("orchestrator");
          },
          stop: async () => {
            stopped.push("orchestrator");
          },
        },
      },
    });

    await manager.startProcess("api-runtime");
    await manager.startProcess("orchestrator");
    await manager.startProcess("hermes-runtime");
    await manager.startProcess("openclaw-runtime");

    expect(started).toEqual(["api-runtime", "orchestrator"]);
    expect(manager.getActiveProcesses()).toHaveLength(
      DEFAULT_RUNTIME_PROCESS_IDS.length,
    );

    const health = manager.getHealth();
    expect(health.status).toBe("healthy");
    expect(health.processes.map((entry) => entry.processId)).toEqual([
      ...DEFAULT_RUNTIME_PROCESS_IDS,
    ]);

    await manager.restartProcess("api-runtime");
    expect(stopped).toContain("api-runtime");
    expect(manager.getProcess("api-runtime")?.state).toBe("running");
    expect(manager.getProcess("api-runtime")?.restartCount).toBe(1);
  });
});
