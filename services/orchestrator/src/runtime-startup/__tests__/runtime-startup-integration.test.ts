import { afterEach, describe, expect, it } from "vitest";

import { createDefaultJarvisApiServer } from "@jarvis/api-runtime";
import type { JarvisApiServer } from "@jarvis/api-runtime";
import {
  createDefaultRuntimeProcessManager,
} from "@jarvis/runtime-process";

import {
  buildProbesFromProcessManager,
  createDefaultRuntimeStartupManager,
} from "../index";

describe("runtime startup integration", () => {
  let server: JarvisApiServer | undefined;

  afterEach(async () => {
    await server?.stop();
    server = undefined;
  });

  it("bootstraps api-runtime then validates orchestrator-backed health", async () => {
    server = await createDefaultJarvisApiServer({ port: 0 });
    const manager = createDefaultRuntimeProcessManager({
      processHandlers: {
        "api-runtime": {
          start: async () => {
            await server!.start();
          },
          stop: async () => {
            await server!.stop();
          },
        },
      },
    });

    const probes = buildProbesFromProcessManager(manager, [
      {
        probeId: "speech-runtime",
        label: "Speech Runtime",
        check: async () => ({ healthy: true }),
      },
    ]);

    const startup = createDefaultRuntimeStartupManager({
      processManager: manager,
      healthProbes: probes,
    });

    const state = await startup.initializeRuntime();

    expect(state.ready).toBe(true);
    expect(state.processCount).toBe(5);
    expect(manager.getActiveProcesses()).toHaveLength(4);

    const health = await server.fetch("/health");
    expect(health.status).toBe(200);
  });
});
