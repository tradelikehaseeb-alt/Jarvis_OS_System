import { describe, expect, it } from "vitest";

import {
  createHybridRuntimeManager,
  createDiscoveryRuntimeResolver,
  MockRuntimeProvider,
} from "../index";

describe("createHybridRuntimeManager", () => {
  it("uses official provider for hermes-local and mock for others", async () => {
    const provider: import("../runtime-provider").RuntimeProvider = {
      runtimeId: "hermes-local",
      detect: async () => ({
        runtimeId: "hermes-local",
        configured: true,
        endpoint: "http://official.local",
        stub: false,
        message: "official",
      }),
      checkHealth: async () => ({
        runtimeId: "hermes-local",
        status: "available",
        available: true,
        lastCheckedAt: new Date().toISOString(),
        message: "official",
        endpoint: "http://official.local",
        stub: false,
      }),
    };

    const manager = createHybridRuntimeManager([provider]);

    const hermes = await manager.checkHealth("hermes-local");
    const cloud = await manager.checkHealth("hermes-cloud");

    expect(hermes.stub).toBe(false);
    expect(hermes.endpoint).toBe("http://official.local");
    expect(cloud.stub).toBe(true);
  });
});

describe("createDiscoveryRuntimeResolver", () => {
  it("resolves configured runtimes through hybrid manager", async () => {
    const provider = new MockRuntimeProvider("openclaw-local", {
      configured: false,
      status: "unavailable",
    });
    const resolver = createDiscoveryRuntimeResolver([
      {
        runtimeId: "openclaw-local",
        detect: () => provider.detect(),
        checkHealth: () => provider.checkHealth(),
      },
    ]);

    const report = await resolver.checkConfiguredRuntimes();
    expect(report.openclaw.runtimeId).toBe("openclaw-local");
    expect(report.hermes.stub).toBe(true);
  });
});
