import { describe, expect, it, vi } from "vitest";

import { createOpenClawAdapterStub } from "../../../adapter/src/openclaw-adapter-stub";
import { createOpenClawGatewayRuntimeWiring } from "../../gateway/openclaw-gateway-runtime-wiring";
import { createOpenClawRuntimeSession } from "../create-openclaw-runtime-session";
import type { OpenClawRuntimeProcessBinding } from "../openclaw-runtime-process-binding";

const request = {
  requestId: "req-runtime-1",
  taskId: "task-runtime-1",
  userId: "user-1",
  intent: { kind: "automate" as const, description: "Validate runtime" },
  contextRef: "ctx-runtime-1",
  requestedActions: ["browser", "file"] as const,
};

describe("OpenClaw runtime session", () => {
  it("initializes, validates stub runtime, executes, and terminates", async () => {
    const session = createOpenClawRuntimeSession({
      adapter: createOpenClawAdapterStub(),
      runtimeWiring: createOpenClawGatewayRuntimeWiring({
        env: { OPENCLAW_MODE: "stub" },
      }),
    });

    const initialized = await session.initializeSession();
    expect(initialized.state).toBe("idle");
    expect(initialized.sessionId).toMatch(/^openclaw-session-/);

    const health = await session.validateRuntime();
    expect(health.valid).toBe(true);
    expect(health.stub).toBe(true);
    expect(health.status).toBe("stub");

    const handshake = await session.executeTask(request);
    expect(handshake.state).toBe("completed");
    expect(handshake.response?.success).toBe(true);
    expect(handshake.response?.executionHandleId).toBe("handle-stub-task-runtime-1");

    const terminated = await session.terminateSession();
    expect(terminated.state).toBe("terminated");
    expect(terminated.terminatedAt).toBeDefined();
  });

  it("fails execution when process binding reports stopped runtime", async () => {
    const binding: OpenClawRuntimeProcessBinding = {
      ensureOpenClawRuntimeRunning: vi.fn().mockResolvedValue(true),
      getOpenClawProcessState: vi.fn().mockResolvedValue("stopped"),
    };

    const session = createOpenClawRuntimeSession({
      adapter: createOpenClawAdapterStub(),
      runtimeWiring: createOpenClawGatewayRuntimeWiring({
        env: { OPENCLAW_MODE: "local", OPENCLAW_ENDPOINT: "http://127.0.0.1:18789" },
      }),
      processBinding: binding,
    });

    await session.initializeSession();
    const health = await session.validateRuntime();

    expect(health.valid).toBe(false);
    expect(health.processState).toBe("stopped");

    const handshake = await session.executeTask(request);
    expect(handshake.state).toBe("failed");
    expect(handshake.response?.success).toBe(false);
    expect(handshake.response?.error?.code).toBe("RUNTIME_UNAVAILABLE");
  });

  it("fails initializeSession when process binding cannot start runtime", async () => {
    const binding: OpenClawRuntimeProcessBinding = {
      ensureOpenClawRuntimeRunning: vi.fn().mockResolvedValue(false),
      getOpenClawProcessState: vi.fn().mockResolvedValue("stopped"),
    };

    const session = createOpenClawRuntimeSession({
      adapter: createOpenClawAdapterStub(),
      runtimeWiring: createOpenClawGatewayRuntimeWiring({
        env: { OPENCLAW_MODE: "stub" },
      }),
      processBinding: binding,
    });

    const initialized = await session.initializeSession();
    expect(initialized.state).toBe("failed");
    expect(initialized.error?.code).toBe("RUNTIME_PROCESS_UNAVAILABLE");
  });
});
