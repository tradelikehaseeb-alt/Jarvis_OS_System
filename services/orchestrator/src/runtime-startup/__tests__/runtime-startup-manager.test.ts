import { describe, expect, it, vi } from "vitest";
import {
  createDefaultRuntimeProcessManager,
} from "@jarvis/runtime-process";

import {
  createDefaultRuntimeRecoveryHandler,
  createDefaultRuntimeStartupManager,
} from "../index";

describe("RuntimeStartupManager", () => {
  it("initializes, validates, and reaches ready state", async () => {
    const manager = createDefaultRuntimeProcessManager();
    const startup = createDefaultRuntimeStartupManager({
      processManager: manager,
    });

    const state = await startup.initializeRuntime();

    expect(state.initialized).toBe(true);
    expect(state.validated).toBe(true);
    expect(state.ready).toBe(true);
    expect(state.phase).toBe("ready");
    expect(state.processCount).toBe(4);
    expect(state.healthyProcessCount).toBe(4);
    expect(startup.getEvents().some((event) => event.kind === "ready")).toBe(
      true,
    );
  });

  it("validateRuntime reports degraded when a probe fails", async () => {
    const startup = createDefaultRuntimeStartupManager({
      healthProbes: [
        {
          probeId: "api-runtime",
          label: "API",
          check: async () => ({ healthy: true }),
        },
        {
          probeId: "speech-runtime",
          label: "Speech",
          check: async () => ({ healthy: false, message: "offline" }),
        },
      ],
    });

    const state = await startup.validateRuntime();

    expect(state.ready).toBe(false);
    expect(state.phase).toBe("degraded");
    expect(state.failedProcesses).toEqual(["speech-runtime"]);
  });

  it("recoverRuntime restarts failed processes", async () => {
    let recoveredOnce = false;
    const restartProcess = vi.fn(async () => {
      recoveredOnce = true;
      return true;
    });
    const recoveryHandler = createDefaultRuntimeRecoveryHandler({
      restartProcess,
    });

    const startup = createDefaultRuntimeStartupManager({
      healthProbes: [
        {
          probeId: "hermes-runtime",
          label: "Hermes",
          check: async () => ({ healthy: recoveredOnce }),
        },
      ],
      recoveryHandler,
    });

    await startup.validateRuntime();
    const recovered = await startup.recoverRuntime();

    expect(restartProcess).toHaveBeenCalledWith("hermes-runtime");
    expect(recovered.recovered).toBe(true);
    expect(recovered.ready).toBe(true);
    expect(recovered.phase).toBe("ready");
  });

  it("getStartupStatus returns latest state without mutation", async () => {
    const startup = createDefaultRuntimeStartupManager({
      healthProbes: [
        {
          probeId: "api-runtime",
          label: "API",
          check: async () => ({ healthy: true }),
        },
      ],
    });

    await startup.validateRuntime();
    const status = startup.getStartupStatus();

    expect(status.ready).toBe(true);
    expect(status.phase).toBe("ready");
  });
});
