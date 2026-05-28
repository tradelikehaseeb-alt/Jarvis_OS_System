import { describe, expect, it } from "vitest";
import { ProviderHealthMonitor } from "../provider-health-monitor";
import { SafeExecutionFallbackRuntime } from "../safe-execution-fallback-runtime";
import { PerformanceTelemetryRuntime } from "../performance-telemetry-runtime";
import { RuntimeRecoveryManager } from "../runtime-recovery-manager";
import { createDefaultRuntimeStartupManager } from "../../runtime-startup/create-default-runtime-startup-manager";
import { SessionRestoreRuntime } from "../session-restore-runtime";

describe("ProviderHealthMonitor", () => {
  it("scores providers and selects fallback", async () => {
    const validation = {
      validateAllProviders: async () => [
        {
          providerId: "openai",
          label: "OpenAI",
          connected: false,
          stub: true,
          connectionStatus: "stub" as const,
          availableModels: [],
          configuredModels: [],
          latencyMs: 900,
          failureHandled: true,
          message: "stub",
          checkedAt: new Date().toISOString(),
        },
        {
          providerId: "ollama",
          label: "Ollama",
          connected: true,
          stub: false,
          connectionStatus: "connected" as const,
          availableModels: ["llama3.2"],
          configuredModels: ["llama3.2"],
          latencyMs: 40,
          failureHandled: false,
          message: "ok",
          checkedAt: new Date().toISOString(),
        },
      ],
      validateProviderHealth: async () => ({
        providerId: "ollama",
        label: "Ollama",
        connected: true,
        stub: false,
        connectionStatus: "connected" as const,
        availableModels: [],
        configuredModels: [],
        latencyMs: 0,
        failureHandled: false,
        message: "ok",
        checkedAt: new Date().toISOString(),
      }),
    };

    const monitor = new ProviderHealthMonitor(validation, 60_000);
    const snapshot = await monitor.refresh();
    expect(snapshot.bestProviderId).toBe("ollama");
    expect(monitor.selectFallbackProvider("openai")).toBe("ollama");
  });
});

describe("SafeExecutionFallbackRuntime", () => {
  it("enters offline and stalled recovery modes", () => {
    const runtime = new SafeExecutionFallbackRuntime();
    expect(runtime.computeDecision({ providerHealthy: true, offline: true }).mode).toBe(
      "offline",
    );
    expect(
      runtime.computeDecision({
        providerHealthy: true,
        offline: false,
        retryCount: 0,
        lastProgressAt: new Date(Date.now() - 60_000).toISOString(),
      }).stalled,
    ).toBe(true);
  });
});

describe("RuntimeRecoveryManager", () => {
  it("tracks recovering state", async () => {
    const manager = createDefaultRuntimeStartupManager();
    const recovery = new RuntimeRecoveryManager(manager);
    expect(recovery.isRecovering).toBe(false);
    const plan = await recovery.recoverDegradedRuntime();
    expect(plan.message).toBeTruthy();
    expect(recovery.isRecovering).toBe(false);
  });
});

describe("SessionRestoreRuntime", () => {
  it("restores checkpoint messages", () => {
    const runtime = new SessionRestoreRuntime(() => ({
      sessionId: "ws-1",
      conversationId: "conv-1",
      messages: [{ role: "user", text: "Hello" }],
      savedAt: new Date().toISOString(),
    }));
    const restored = runtime.restore("ws-1");
    expect(restored.restored).toBe(true);
    expect(restored.messages[0]?.text).toBe("Hello");
  });
});

describe("PerformanceTelemetryRuntime", () => {
  it("tracks p95 latency", async () => {
    const telemetry = new PerformanceTelemetryRuntime();
    telemetry.record("recall", 10);
    telemetry.record("recall", 30);
    telemetry.record("recall", 50);
    const snapshot = telemetry.snapshot("recall");
    expect(snapshot.averageMs).toBeGreaterThan(0);
    expect(snapshot.p95Ms).toBeGreaterThanOrEqual(30);
  });
});
