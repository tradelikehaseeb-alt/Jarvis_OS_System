import { describe, expect, it, vi } from "vitest";

import { OpenClawRuntimeDiscoveryAdapter } from "../openclaw-runtime-discovery-adapter";

describe("OpenClawRuntimeDiscoveryAdapter", () => {
  it("targets openclaw-local runtime id", async () => {
    const adapter = new OpenClawRuntimeDiscoveryAdapter({
      env: { OPENCLAW_MODE: "local" },
    });
    const detection = await adapter.detect();
    expect(detection.runtimeId).toBe("openclaw-local");
    expect(detection.stub).toBe(false);
  });

  it("returns available health when probe succeeds", async () => {
    const adapter = new OpenClawRuntimeDiscoveryAdapter({
      env: {
        OPENCLAW_MODE: "local",
        OPENCLAW_ENDPOINT: "http://127.0.0.1:18789",
      },
      probe: vi.fn().mockResolvedValue({
        reachable: true,
        statusCode: 200,
        probe: "head" as const,
      }),
    });

    const health = await adapter.checkHealth();
    expect(health.status).toBe("available");
    expect(health.stub).toBe(false);
  });
});
