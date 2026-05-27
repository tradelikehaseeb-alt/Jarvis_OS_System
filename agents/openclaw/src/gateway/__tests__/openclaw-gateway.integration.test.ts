import { describe, expect, it, vi } from "vitest";
import { createDefaultProviderResolver } from "@jarvis/provider-registry";
import {
  MockRuntimeProvider,
  createDiscoveryRuntimeResolver,
} from "@jarvis/runtime-manager";

import {
  DefaultOpenClawGateway,
  createDefaultOpenClawGateway,
  createOpenClawGatewayRuntimeWiring,
} from "../index";

const request = {
  requestId: "req-gw-1",
  taskId: "task-gw-1",
  userId: "user-1",
  intent: { kind: "automate" as const, description: "Open dashboard" },
  contextRef: "ctx-1",
  requestedActions: ["browser", "file"] as const,
};

describe("OpenClaw gateway", () => {
  it("validates stub runtime by default", async () => {
    const gateway = createDefaultOpenClawGateway({
      env: { OPENCLAW_MODE: "stub" },
    });
    const validation = await gateway.validateRuntime();
    expect(validation.valid).toBe(true);
    expect(validation.status).toBe("stub");
    expect(validation.reasons).toEqual([]);
  });

  it("returns stub runtime status", async () => {
    const gateway = createDefaultOpenClawGateway({
      env: { OPENCLAW_MODE: "stub" },
    });
    await expect(gateway.getRuntimeStatus()).resolves.toBe("stub");
  });

  it("executes through adapter stub boundary", async () => {
    const gateway = new DefaultOpenClawGateway({
      env: { OPENCLAW_MODE: "stub" },
    });
    const response = await gateway.execute(request);

    expect(response.success).toBe(true);
    expect(response.stub).toBe(true);
    expect(response.runtimeStatus).toBe("stub");
    expect(response.executionHandleId).toBe("handle-stub-task-gw-1");
    expect(response.approvedActions).toEqual(["browser", "file"]);
  });

  it("rejects execution when runtime validation fails", async () => {
    const gateway = createDefaultOpenClawGateway({
      env: {
        OPENCLAW_MODE: "local",
        OPENCLAW_ENDPOINT: "http://127.0.0.1:59999",
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

describe("OpenClaw gateway runtime wiring", () => {
  it("resolveProviderMetadata returns configured OpenClaw provider", async () => {
    const gateway = createDefaultOpenClawGateway({
      env: { OPENCLAW_MODE: "stub" },
    });
    const metadata = await gateway.resolveProviderMetadata();

    expect(metadata.providerId).toBe("openclaw-local");
    expect(metadata.family).toBe("openclaw");
  });

  it("resolveConfiguredRuntime uses runtime-manager discovery", async () => {
    const provider = new MockRuntimeProvider("openclaw-local", {
      endpoint: "http://wired.local/openclaw",
    });
    const runtimeResolver = createDiscoveryRuntimeResolver([
      {
        runtimeId: "openclaw-local",
        detect: () => provider.detect(),
        checkHealth: () => provider.checkHealth(),
      },
    ]);

    const wiring = createOpenClawGatewayRuntimeWiring({
      env: { OPENCLAW_MODE: "local" },
      runtimeResolver,
    });

    const detection = await wiring.resolveConfiguredRuntime();
    expect(detection.runtimeId).toBe("openclaw-local");
    expect(detection.endpoint).toBe("http://wired.local/openclaw");
  });

  it("getRuntimeHealth delegates to runtime resolver", async () => {
    const checkHealth = vi.fn().mockResolvedValue({
      runtimeId: "openclaw-local",
      status: "degraded",
      available: true,
      lastCheckedAt: new Date().toISOString(),
      message: "degraded probe",
      endpoint: "http://127.0.0.1:18789",
      stub: false,
    });

    const runtimeResolver = createDiscoveryRuntimeResolver([
      {
        runtimeId: "openclaw-local",
        detect: async () => ({
          runtimeId: "openclaw-local",
          configured: true,
          endpoint: "http://127.0.0.1:18789",
          stub: false,
          message: "configured",
        }),
        checkHealth,
      },
    ]);

    const gateway = createDefaultOpenClawGateway({
      env: { OPENCLAW_MODE: "local" },
      runtimeResolver,
      providerResolver: createDefaultProviderResolver(),
    });

    const health = await gateway.getRuntimeHealth();
    expect(health.status).toBe("degraded");
    expect(health.available).toBe(true);
    expect(checkHealth).toHaveBeenCalled();
  });
});

describe("OpenClaw gateway integration", () => {
  it("agent execute includes gateway payload", async () => {
    const { createDefaultSkillPipeline } = await import("@jarvis/agents-shared");
    const { createOpenClawAgent } = await import("../../index");

    const { skillExecutor } = await createDefaultSkillPipeline();
    const agent = createOpenClawAgent(skillExecutor);
    const result = await agent.execute(
      {
        taskId: "task-int-1",
        requestId: "req-int-1",
        userId: "user-1",
        intent: { kind: "automate", description: "Run task" },
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
      (result.payload?.execution as { runtimeStatus?: string }).runtimeStatus,
    ).toBe("stub");
  });
});
