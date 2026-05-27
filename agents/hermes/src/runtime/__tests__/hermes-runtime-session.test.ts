import { describe, expect, it, vi } from "vitest";

import { createHermesAdapterStub } from "../../../adapter/src/hermes-adapter-stub";
import { createHermesGatewayRuntimeWiring } from "../../gateway/hermes-gateway-runtime-wiring";
import { createHermesRuntimeSession } from "../create-hermes-runtime-session";
import type { HermesRuntimeProcessBinding } from "../hermes-runtime-process-binding";

const request = {
  requestId: "req-runtime-1",
  taskId: "task-runtime-1",
  userId: "user-1",
  intent: { kind: "plan" as const, description: "Plan my week" },
  contextRef: "ctx-runtime-1",
};

describe("Hermes runtime session", () => {
  it("initializes, validates stub runtime, generates plan, and terminates", async () => {
    const session = createHermesRuntimeSession({
      adapter: createHermesAdapterStub(),
      runtimeWiring: createHermesGatewayRuntimeWiring({
        env: { HERMES_MODE: "stub" },
      }),
    });

    const initialized = await session.initializeSession();
    expect(initialized.state).toBe("idle");
    expect(initialized.sessionId).toMatch(/^hermes-session-/);

    const health = await session.validateRuntime();
    expect(health.valid).toBe(true);
    expect(health.stub).toBe(true);
    expect(health.status).toBe("stub");

    const handshake = await session.generatePlan(request);
    expect(handshake.state).toBe("completed");
    expect(handshake.response?.success).toBe(true);
    expect(handshake.response?.plan.goal).toBe("Plan my week");
    expect(handshake.response?.plan.steps.length).toBeGreaterThan(0);

    const terminated = await session.terminateSession();
    expect(terminated.state).toBe("terminated");
    expect(terminated.terminatedAt).toBeDefined();
  });

  it("fails planning when process binding reports stopped runtime", async () => {
    const binding: HermesRuntimeProcessBinding = {
      ensureHermesRuntimeRunning: vi.fn().mockResolvedValue(true),
      getHermesProcessState: vi.fn().mockResolvedValue("stopped"),
    };

    const session = createHermesRuntimeSession({
      adapter: createHermesAdapterStub(),
      runtimeWiring: createHermesGatewayRuntimeWiring({
        env: { HERMES_MODE: "local", HERMES_ENDPOINT: "http://127.0.0.1:8080" },
      }),
      processBinding: binding,
    });

    await session.initializeSession();
    const health = await session.validateRuntime();

    expect(health.valid).toBe(false);
    expect(health.processState).toBe("stopped");

    const handshake = await session.generatePlan(request);
    expect(handshake.state).toBe("failed");
    expect(handshake.response?.success).toBe(false);
    expect(handshake.response?.error?.code).toBe("RUNTIME_UNAVAILABLE");
  });

  it("fails initializeSession when process binding cannot start runtime", async () => {
    const binding: HermesRuntimeProcessBinding = {
      ensureHermesRuntimeRunning: vi.fn().mockResolvedValue(false),
      getHermesProcessState: vi.fn().mockResolvedValue("stopped"),
    };

    const session = createHermesRuntimeSession({
      adapter: createHermesAdapterStub(),
      runtimeWiring: createHermesGatewayRuntimeWiring({
        env: { HERMES_MODE: "stub" },
      }),
      processBinding: binding,
    });

    const initialized = await session.initializeSession();
    expect(initialized.state).toBe("failed");
    expect(initialized.error?.code).toBe("RUNTIME_PROCESS_UNAVAILABLE");
  });
});
