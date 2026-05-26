import { describe, expect, it } from "vitest";

import {
  InMemoryRuntimeManager,
  MockRuntimeProvider,
  createDefaultRuntimeManager,
  createDefaultRuntimeResolver,
  isRuntimeReachable,
} from "../index";

describe("InMemoryRuntimeManager", () => {
  it("registers all four supported runtimes", () => {
    const manager = createDefaultRuntimeManager();
    expect(manager.list().sort()).toEqual(
      [
        "hermes-cloud",
        "hermes-local",
        "openclaw-local",
        "openclaw-remote",
      ].sort(),
    );
  });

  it("returns mock health for hermes-local", async () => {
    const manager = createDefaultRuntimeManager();
    const health = await manager.checkHealth("hermes-local");
    expect(health.stub).toBe(true);
    expect(health.status).toBe("available");
    expect(health.available).toBe(true);
    expect(health.endpoint).toContain("hermes");
  });

  it("returns degraded mock health for openclaw-remote", async () => {
    const manager = createDefaultRuntimeManager();
    const health = await manager.checkHealth("openclaw-remote");
    expect(health.status).toBe("degraded");
    expect(isRuntimeReachable(health.status)).toBe(true);
  });

  it("detect reports configured endpoint", async () => {
    const manager = createDefaultRuntimeManager();
    const detection = await manager.detect("openclaw-local");
    expect(detection.configured).toBe(true);
    expect(detection.endpoint).toContain("18789");
  });

  it("throws for unregistered runtime", async () => {
    const manager = new InMemoryRuntimeManager();
    manager.register(new MockRuntimeProvider("hermes-local"));
    await expect(manager.checkHealth("openclaw-local")).rejects.toThrow(
      /not registered/,
    );
  });
});

describe("MockRuntimeProvider", () => {
  it("can simulate unavailable runtime", async () => {
    const provider = new MockRuntimeProvider("hermes-cloud", {
      status: "unavailable",
      configured: false,
    });
    const health = await provider.checkHealth();
    expect(health.available).toBe(false);
    expect(health.status).toBe("unavailable");
  });
});

describe("RuntimeResolver", () => {
  it("checks configured hermes and openclaw from default config", async () => {
    const resolver = createDefaultRuntimeResolver();
    const report = await resolver.checkConfiguredRuntimes();
    expect(report.hermes.runtimeId).toBe("hermes-local");
    expect(report.openclaw.runtimeId).toBe("openclaw-local");
    expect(report.allAvailable).toBe(true);
  });

  it("uses custom provider config", async () => {
    const resolver = createDefaultRuntimeResolver({
      hermesProviderId: "hermes-cloud",
      openclawProviderId: "openclaw-remote",
    });
    const report = await resolver.checkConfiguredRuntimes();
    expect(report.hermes.runtimeId).toBe("hermes-cloud");
    expect(report.openclaw.runtimeId).toBe("openclaw-remote");
  });

  it("checkAllRegistered returns four health entries", async () => {
    const resolver = createDefaultRuntimeResolver();
    const all = await resolver.checkAllRegistered();
    expect(all).toHaveLength(4);
  });
});
