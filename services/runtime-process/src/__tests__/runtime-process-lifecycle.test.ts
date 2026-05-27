import { describe, expect, it } from "vitest";

import {
  createDefaultRuntimeProcessManager,
  DEFAULT_RUNTIME_PROCESS_IDS,
  InMemoryRuntimeProcessManager,
} from "../index";

describe("InMemoryRuntimeProcessManager lifecycle", () => {
  it("starts a registered process and transitions to running", async () => {
    const manager = new InMemoryRuntimeProcessManager();
    let started = false;

    manager.registerProcess({
      processId: "test-process",
      label: "Test Process",
      handlers: {
        start: async () => {
          started = true;
        },
      },
    });

    const process = await manager.startProcess("test-process");

    expect(started).toBe(true);
    expect(process.state).toBe("running");
    expect(process.startedAt).toBeDefined();
    expect(process.stoppedAt).toBeUndefined();
  });

  it("stops a running process", async () => {
    const manager = new InMemoryRuntimeProcessManager();
    let stopped = false;

    manager.registerProcess({
      processId: "test-process",
      label: "Test Process",
      handlers: {
        start: async () => {},
        stop: async () => {
          stopped = true;
        },
      },
    });

    await manager.startProcess("test-process");
    const stoppedProcess = await manager.stopProcess("test-process");

    expect(stopped).toBe(true);
    expect(stoppedProcess.state).toBe("stopped");
    expect(stoppedProcess.stoppedAt).toBeDefined();
  });

  it("restarts a process and increments restartCount", async () => {
    const manager = new InMemoryRuntimeProcessManager();
    let startCount = 0;
    let stopCount = 0;

    manager.registerProcess({
      processId: "test-process",
      label: "Test Process",
      handlers: {
        start: async () => {
          startCount += 1;
        },
        stop: async () => {
          stopCount += 1;
        },
      },
    });

    await manager.startProcess("test-process");
    const restarted = await manager.restartProcess("test-process");

    expect(stopCount).toBe(1);
    expect(startCount).toBe(2);
    expect(restarted.state).toBe("running");
    expect(restarted.restartCount).toBe(1);
  });

  it("marks process as failed when start handler throws", async () => {
    const manager = new InMemoryRuntimeProcessManager();

    manager.registerProcess({
      processId: "failing-process",
      label: "Failing Process",
      handlers: {
        start: async () => {
          throw new Error("start failed");
        },
      },
    });

    const process = await manager.startProcess("failing-process");

    expect(process.state).toBe("failed");
    expect(process.lastError).toBe("start failed");
  });

  it("returns active processes in starting, running, or restarting states", async () => {
    const manager = new InMemoryRuntimeProcessManager();

    manager.registerProcess({
      processId: "active",
      label: "Active",
      handlers: { start: async () => {} },
    });
    manager.registerProcess({
      processId: "idle",
      label: "Idle",
    });

    await manager.startProcess("active");
    const active = manager.getActiveProcesses();

    expect(active).toHaveLength(1);
    expect(active[0]?.processId).toBe("active");
  });

  it("reports aggregate health", async () => {
    const manager = new InMemoryRuntimeProcessManager();

    manager.registerProcess({
      processId: "healthy",
      label: "Healthy",
      handlers: { start: async () => {} },
    });
    manager.registerProcess({
      processId: "stopped",
      label: "Stopped",
    });

    await manager.startProcess("healthy");
    const health = manager.getHealth();

    expect(health.processCount).toBe(2);
    expect(health.runningCount).toBe(1);
    expect(health.failedCount).toBe(0);
    expect(health.status).toBe("degraded");
    expect(health.processes).toHaveLength(2);
  });
});

describe("createDefaultRuntimeProcessManager", () => {
  it("registers all default Jarvis runtime processes", () => {
    const manager = createDefaultRuntimeProcessManager();

    for (const processId of DEFAULT_RUNTIME_PROCESS_IDS) {
      expect(manager.getProcess(processId)).toBeDefined();
    }
  });

  it("starts default processes with stub handlers deterministically", async () => {
    const manager = createDefaultRuntimeProcessManager();

    for (const processId of DEFAULT_RUNTIME_PROCESS_IDS) {
      const process = await manager.startProcess(processId);
      expect(process.state).toBe("running");
    }

    const health = manager.getHealth();
    expect(health.status).toBe("healthy");
    expect(health.runningCount).toBe(DEFAULT_RUNTIME_PROCESS_IDS.length);
    expect(manager.getActiveProcesses()).toHaveLength(
      DEFAULT_RUNTIME_PROCESS_IDS.length,
    );
  });
});
