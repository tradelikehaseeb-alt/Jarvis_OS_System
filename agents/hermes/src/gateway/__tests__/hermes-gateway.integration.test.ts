import { describe, expect, it, vi } from "vitest";
import { createDefaultProviderResolver } from "@jarvis/provider-registry";
import {
  MockRuntimeProvider,
  createDiscoveryRuntimeResolver,
} from "@jarvis/runtime-manager";

import {
  DefaultHermesGateway,
  createDefaultHermesGateway,
  createHermesGatewayRuntimeWiring,
} from "../index";
import { createHermesPlanningAdapter } from "../../index";

const request = {
  requestId: "req-gw-1",
  taskId: "task-gw-1",
  userId: "user-1",
  intent: { kind: "plan" as const, description: "Plan my week" },
  contextRef: "ctx-1",
};

describe("Hermes gateway", () => {
  it("validates stub runtime by default", async () => {
    const gateway = createDefaultHermesGateway({
      env: { HERMES_MODE: "stub" },
    });
    const validation = await gateway.validateRuntime();
    expect(validation.valid).toBe(true);
    expect(validation.status).toBe("stub");
    expect(validation.reasons).toEqual([]);
  });

  it("returns stub runtime status", async () => {
    const gateway = createDefaultHermesGateway({
      env: { HERMES_MODE: "stub" },
    });
    await expect(gateway.getRuntimeStatus()).resolves.toBe("stub");
  });

  it("executes through adapter stub boundary", async () => {
    const gateway = new DefaultHermesGateway({
      env: { HERMES_MODE: "stub" },
    });
    const response = await gateway.execute(request);

    expect(response.success).toBe(true);
    expect(response.stub).toBe(true);
    expect(response.runtimeStatus).toBe("stub");
    expect(response.plan.goal).toBe("Plan my week");
    expect(response.plan.steps.length).toBeGreaterThan(0);
  });

  it("executes through planning adapter when wired", async () => {
    const gateway = createDefaultHermesGateway({
      env: { HERMES_MODE: "stub" },
      adapter: createHermesPlanningAdapter(),
    });
    const response = await gateway.execute(request);

    expect(response.success).toBe(true);
    expect(response.stub).toBe(false);
    expect(response.plan.steps.length).toBeGreaterThanOrEqual(3);
  });

  it("rejects execution when runtime validation fails", async () => {
    const gateway = createDefaultHermesGateway({
      env: {
        HERMES_MODE: "local",
        HERMES_ENDPOINT: "http://127.0.0.1:59999",
      },
      allowNetworkProbe: false,
    });

    const validation = await gateway.validateRuntime();
    expect(validation.valid).toBe(false);

    const response = await gateway.execute(request);
    expect(response.success).toBe(false);
    expect(response.error?.code).toBe("RUNTIME_UNAVAILABLE");
  });
});

describe("Hermes gateway runtime wiring", () => {
  it("resolveProviderMetadata returns configured Hermes provider", async () => {
    const gateway = createDefaultHermesGateway({ env: { HERMES_MODE: "stub" } });
    const metadata = await gateway.resolveProviderMetadata();

    expect(metadata.providerId).toBe("hermes-local");
    expect(metadata.family).toBe("hermes");
  });

  it("resolveConfiguredRuntime uses runtime-manager discovery", async () => {
    const provider = new MockRuntimeProvider("hermes-local", {
      endpoint: "http://wired.local/hermes",
    });
    const runtimeResolver = createDiscoveryRuntimeResolver([
      {
        runtimeId: "hermes-local",
        detect: () => provider.detect(),
        checkHealth: () => provider.checkHealth(),
      },
    ]);

    const wiring = createHermesGatewayRuntimeWiring({
      env: { HERMES_MODE: "local" },
      runtimeResolver,
    });

    const detection = await wiring.resolveConfiguredRuntime();
    expect(detection.runtimeId).toBe("hermes-local");
    expect(detection.endpoint).toBe("http://wired.local/hermes");
  });

  it("getRuntimeHealth delegates to runtime resolver", async () => {
    const checkHealth = vi.fn().mockResolvedValue({
      runtimeId: "hermes-local",
      status: "degraded",
      available: true,
      lastCheckedAt: new Date().toISOString(),
      message: "degraded probe",
      endpoint: "http://127.0.0.1:8080",
      stub: false,
    });

    const runtimeResolver = createDiscoveryRuntimeResolver([
      {
        runtimeId: "hermes-local",
        detect: async () => ({
          runtimeId: "hermes-local",
          configured: true,
          endpoint: "http://127.0.0.1:8080",
          stub: false,
          message: "configured",
        }),
        checkHealth,
      },
    ]);

    const gateway = createDefaultHermesGateway({
      env: { HERMES_MODE: "local" },
      runtimeResolver,
      providerResolver: createDefaultProviderResolver(),
    });

    const health = await gateway.getRuntimeHealth();
    expect(health.status).toBe("degraded");
    expect(health.available).toBe(true);
    expect(checkHealth).toHaveBeenCalled();
  });
});

describe("Hermes gateway integration", () => {
  it("agent execute includes gateway payload", async () => {
    const { createDefaultSkillPipeline } = await import("@jarvis/agents-shared");
    const { createHermesAgent } = await import("../../index");

    const { skillExecutor } = await createDefaultSkillPipeline();
    const agent = createHermesAgent(skillExecutor);
    const result = await agent.execute(
      {
        taskId: "task-int-1",
        requestId: "req-int-1",
        userId: "user-1",
        intent: { kind: "plan", description: "Plan sprint" },
        workflowStepId: "step-1",
      },
      { contextRef: "ctx-int-1", userId: "user-1" },
    );

    expect(result.success).toBe(true);
    expect(result.payload?.gateway).toMatchObject({
      stub: true,
      runtimeStatus: "stub",
    });
    expect(
      (result.payload?.planning as { runtimeStatus?: string }).runtimeStatus,
    ).toBe("stub");
  });
});
