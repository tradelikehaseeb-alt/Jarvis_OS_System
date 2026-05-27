import { afterEach, describe, expect, it } from "vitest";

import { createDefaultJarvisApiServer } from "@jarvis/api-runtime";
import type { JarvisApiServer } from "@jarvis/api-runtime";
import {
  createDefaultRuntimeProcessManager,
} from "@jarvis/runtime-process";

import {
  createDefaultRuntimeHealthRuntime,
} from "../create-default-runtime-health-runtime";
import { createDefaultRuntimeStartupManager } from "../../runtime-startup/create-default-runtime-startup-manager";

describe("runtime health integration", () => {
  let server: JarvisApiServer | undefined;

  afterEach(async () => {
    await server?.stop();
    server = undefined;
  });

  it("aggregates process manager health after startup bootstrap", async () => {
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
    const startup = createDefaultRuntimeStartupManager({ processManager: manager });
    const healthRuntime = createDefaultRuntimeHealthRuntime({
      processManager: manager,
      startupManager: startup,
      getMemoryHealth: () => ({ healthy: true, message: "Memory store ready" }),
      getSpeechHealth: () => ({ healthy: true, message: "Speech runtime ready" }),
    });

    await startup.initializeRuntime();
    const health = await healthRuntime.refresh();

    expect(health.status).toBe("healthy");
    expect(health.recoveryState).toBe("none");
    expect(health.components.find((c) => c.componentId === "hermes")?.healthy).toBe(
      true,
    );
    expect(healthRuntime.getStartupProgress().ready).toBe(true);
  });
});
