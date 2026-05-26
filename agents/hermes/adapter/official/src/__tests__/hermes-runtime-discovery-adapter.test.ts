import { describe, expect, it, vi } from "vitest";

import { HermesRuntimeDiscoveryAdapter } from "../hermes-runtime-discovery-adapter";

describe("HermesRuntimeDiscoveryAdapter", () => {
  it("detect returns non-stub detection when configured", async () => {
    const adapter = new HermesRuntimeDiscoveryAdapter({
      env: { HERMES_MODE: "local", HERMES_ENDPOINT: "http://127.0.0.1:8080" },
    });
    const detection = await adapter.detect();
    expect(detection.runtimeId).toBe("hermes-local");
    expect(detection.stub).toBe(false);
    expect(detection.configured).toBe(true);
  });

  it("checkHealth uses injected probe without live network", async () => {
    const probe = vi.fn().mockResolvedValue({
      reachable: true,
      statusCode: 200,
      probe: "head" as const,
    });

    const adapter = new HermesRuntimeDiscoveryAdapter({
      env: { HERMES_MODE: "official", HERMES_ENDPOINT: "http://127.0.0.1:8080" },
      probe,
      allowNetworkProbe: false,
    });

    const health = await adapter.checkHealth();
    expect(health.stub).toBe(false);
    expect(health.status).toBe("available");
    expect(health.available).toBe(true);
    expect(probe).toHaveBeenCalledWith("http://127.0.0.1:8080", {
      allowNetwork: false,
    });
  });

  it("reports unavailable when not configured", async () => {
    const adapter = new HermesRuntimeDiscoveryAdapter({ env: {} });
    const health = await adapter.checkHealth();
    expect(health.status).toBe("unavailable");
    expect(health.available).toBe(false);
  });

  it("reports unavailable when probe fails", async () => {
    const adapter = new HermesRuntimeDiscoveryAdapter({
      env: { HERMES_MODE: "local" },
      probe: vi.fn().mockResolvedValue({
        reachable: false,
        probe: "head" as const,
        error: "ECONNREFUSED",
      }),
    });
    const health = await adapter.checkHealth();
    expect(health.status).toBe("unavailable");
    expect(health.available).toBe(false);
  });
});
