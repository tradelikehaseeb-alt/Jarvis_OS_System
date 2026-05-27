import { afterEach, describe, expect, it } from "vitest";

import { createDefaultJarvisApiServer } from "@jarvis/api-runtime";
import type { JarvisApiServer } from "@jarvis/api-runtime";
import { createDefaultRuntimeProcessManager } from "@jarvis/runtime-process";

describe("Desktop runtime process manager integration", () => {
  let server: JarvisApiServer | undefined;

  afterEach(async () => {
    await server?.stop();
    server = undefined;
  });

  it("starts api-runtime process before serving orchestrator-backed tasks", async () => {
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

    const apiProcess = await manager.startProcess("api-runtime");
    expect(apiProcess.state).toBe("running");

    await manager.startProcess("orchestrator");
    await manager.startProcess("hermes-runtime");
    await manager.startProcess("openclaw-runtime");

    const health = await server.fetch("/health");
    expect(health.status).toBe(200);

    const runtimeHealth = manager.getHealth();
    expect(runtimeHealth.status).toBe("healthy");
    expect(manager.getActiveProcesses()).toHaveLength(4);

    await manager.stopProcess("api-runtime");
    expect(manager.getProcess("api-runtime")?.state).toBe("stopped");
  });
});
