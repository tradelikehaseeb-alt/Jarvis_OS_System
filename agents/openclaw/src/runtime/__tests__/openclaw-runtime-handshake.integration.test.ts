import { describe, expect, it, vi } from "vitest";
import {
  MockRuntimeProvider,
  createDiscoveryRuntimeResolver,
} from "@jarvis/runtime-manager";
import { createDefaultRuntimeProcessManager } from "@jarvis/runtime-process";

import { createOpenClawAdapterStub } from "../../../adapter/src/openclaw-adapter-stub";
import { DefaultOpenClawGateway } from "../../gateway/default-openclaw-gateway";
import type { OpenClawRuntimeProcessBinding } from "../openclaw-runtime-process-binding";

const request = {
  requestId: "req-handshake-1",
  taskId: "task-handshake-1",
  userId: "user-1",
  intent: { kind: "automate" as const, description: "Handshake task" },
  contextRef: "ctx-handshake-1",
  requestedActions: ["browser", "file"] as const,
};

function createProcessManagerBinding(): OpenClawRuntimeProcessBinding {
  const manager = createDefaultRuntimeProcessManager();

  return {
    ensureOpenClawRuntimeRunning: async () => {
      const process = await manager.startProcess("openclaw-runtime");
      return process.state === "running";
    },
    getOpenClawProcessState: async () => manager.getProcess("openclaw-runtime")?.state,
  };
}

describe("OpenClaw runtime handshake integration", () => {
  it("gateway executes through runtime session with process manager binding", async () => {
    const gateway = new DefaultOpenClawGateway({
      env: { OPENCLAW_MODE: "stub" },
      adapter: createOpenClawAdapterStub(),
      processBinding: createProcessManagerBinding(),
    });

    const response = await gateway.execute(request);

    expect(response.success).toBe(true);
    expect(response.stub).toBe(true);
    expect(response.runtimeStatus).toBe("stub");
    expect(response.executionHandleId).toBe("handle-stub-task-handshake-1");
  });

  it("gateway rejects when openclaw runtime process is stopped under local mode", async () => {
    const provider = new MockRuntimeProvider("openclaw-local", {
      endpoint: "http://127.0.0.1:18789",
    });
    const runtimeResolver = createDiscoveryRuntimeResolver([
      {
        runtimeId: "openclaw-local",
        detect: () => provider.detect(),
        checkHealth: () => provider.checkHealth(),
      },
    ]);

    const binding: OpenClawRuntimeProcessBinding = {
      ensureOpenClawRuntimeRunning: vi.fn().mockResolvedValue(true),
      getOpenClawProcessState: vi.fn().mockResolvedValue("stopped"),
    };

    const gateway = new DefaultOpenClawGateway({
      env: {
        OPENCLAW_MODE: "local",
        OPENCLAW_ENDPOINT: "http://127.0.0.1:18789",
      },
      adapter: createOpenClawAdapterStub(),
      processBinding: binding,
      runtimeResolver,
    });

    const response = await gateway.execute(request);
    expect(response.success).toBe(false);
    expect(response.error?.code).toBe("RUNTIME_UNAVAILABLE");
  });
});
