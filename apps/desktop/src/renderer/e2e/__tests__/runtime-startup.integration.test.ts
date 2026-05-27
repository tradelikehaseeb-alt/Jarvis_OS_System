import { afterEach, describe, expect, it } from "vitest";

import { createDefaultJarvisApiServer } from "@jarvis/api-runtime";
import type { JarvisApiServer } from "@jarvis/api-runtime";
import {
  createDefaultRuntimeProcessManager,
} from "@jarvis/runtime-process";
import {
  buildProbesFromProcessManager,
  createDefaultRuntimeStartupManager,
} from "@jarvis/orchestrator";

describe("Desktop runtime startup integration", () => {
  let server: JarvisApiServer | undefined;

  afterEach(async () => {
    await server?.stop();
    server = undefined;
  });

  it("follows bootstrap → validation → ready for managed processes", async () => {
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

    const startup = createDefaultRuntimeStartupManager({
      processManager: manager,
      healthProbes: buildProbesFromProcessManager(manager, [
        {
          probeId: "speech-runtime",
          label: "Speech Runtime",
          check: async () => ({ healthy: true }),
        },
      ]),
    });

    const initialized = await startup.initializeRuntime();

    expect(initialized.initialized).toBe(true);
    expect(initialized.validated).toBe(true);
    expect(initialized.ready).toBe(true);
    expect(startup.getStartupStatus().phase).toBe("ready");
  });
});
