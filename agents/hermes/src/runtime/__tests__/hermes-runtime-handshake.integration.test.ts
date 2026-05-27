import { describe, expect, it, vi } from "vitest";
import {
  MockRuntimeProvider,
  createDiscoveryRuntimeResolver,
} from "@jarvis/runtime-manager";
import { createDefaultRuntimeProcessManager } from "@jarvis/runtime-process";

import { createHermesAdapterStub } from "../../../adapter/src/hermes-adapter-stub";
import { DefaultHermesGateway } from "../../gateway/default-hermes-gateway";
import type { HermesRuntimeProcessBinding } from "../hermes-runtime-process-binding";

const request = {
  requestId: "req-handshake-1",
  taskId: "task-handshake-1",
  userId: "user-1",
  intent: { kind: "plan" as const, description: "Plan sprint" },
  contextRef: "ctx-handshake-1",
};

function createProcessManagerBinding(): HermesRuntimeProcessBinding {
  const manager = createDefaultRuntimeProcessManager();

  return {
    ensureHermesRuntimeRunning: async () => {
      const process = await manager.startProcess("hermes-runtime");
      return process.state === "running";
    },
    getHermesProcessState: async () => manager.getProcess("hermes-runtime")?.state,
  };
}

describe("Hermes runtime planning handshake integration", () => {
  it("gateway plans through runtime session with process manager binding", async () => {
    const gateway = new DefaultHermesGateway({
      env: { HERMES_MODE: "stub" },
      adapter: createHermesAdapterStub(),
      processBinding: createProcessManagerBinding(),
    });

    const response = await gateway.execute(request);

    expect(response.success).toBe(true);
    expect(response.stub).toBe(true);
    expect(response.runtimeStatus).toBe("stub");
    expect(response.plan.goal).toBe("Plan sprint");
    expect(response.plan.steps.length).toBeGreaterThan(0);
  });

  it("gateway rejects when hermes runtime process is stopped under local mode", async () => {
    const provider = new MockRuntimeProvider("hermes-local", {
      endpoint: "http://127.0.0.1:8080",
    });
    const runtimeResolver = createDiscoveryRuntimeResolver([
      {
        runtimeId: "hermes-local",
        detect: () => provider.detect(),
        checkHealth: () => provider.checkHealth(),
      },
    ]);

    const binding: HermesRuntimeProcessBinding = {
      ensureHermesRuntimeRunning: vi.fn().mockResolvedValue(true),
      getHermesProcessState: vi.fn().mockResolvedValue("stopped"),
    };

    const gateway = new DefaultHermesGateway({
      env: {
        HERMES_MODE: "local",
        HERMES_ENDPOINT: "http://127.0.0.1:8080",
      },
      adapter: createHermesAdapterStub(),
      processBinding: binding,
      runtimeResolver,
    });

    const response = await gateway.execute(request);
    expect(response.success).toBe(false);
    expect(response.error?.code).toBe("RUNTIME_UNAVAILABLE");
  });
});
