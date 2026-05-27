import { describe, expect, it } from "vitest";

import {
  createDefaultProviderRuntime,
  DEFAULT_HERMES_PROVIDER_ID,
  DEFAULT_OPENCLAW_PROVIDER_ID,
  InMemoryProviderRegistry,
} from "../index";

describe("InMemoryProviderRuntime", () => {
  it("connects and disconnects stub providers", async () => {
    const runtime = createDefaultProviderRuntime();

    const session = await runtime.connect(DEFAULT_HERMES_PROVIDER_ID);
    expect(session.connection.state).toBe("connected");
    expect(session.connection.stub).toBe(true);

    const disconnected = await runtime.disconnect(DEFAULT_HERMES_PROVIDER_ID);
    expect(disconnected.state).toBe("disconnected");
    expect(disconnected.disconnectedAt).toBeDefined();
  });

  it("validates connection by connecting when needed", async () => {
    const runtime = createDefaultProviderRuntime();

    expect(await runtime.validateConnection(DEFAULT_OPENCLAW_PROVIDER_ID)).toBe(true);
    expect(await runtime.validateConnection(DEFAULT_OPENCLAW_PROVIDER_ID)).toBe(true);
  });

  it("reports aggregate provider health", async () => {
    const runtime = createDefaultProviderRuntime();
    await runtime.connect(DEFAULT_HERMES_PROVIDER_ID);

    const health = await runtime.getHealth();
    expect(health.length).toBe(4);

    const hermes = await runtime.getHealthFor(DEFAULT_HERMES_PROVIDER_ID);
    expect(hermes?.connected).toBe(true);
    expect(hermes?.status).toBe("healthy");
  });

  it("throws for unregistered provider", async () => {
    const registry = new InMemoryProviderRegistry();
    const runtime = createDefaultProviderRuntime({ registry });

    await expect(runtime.connect("unknown-provider")).rejects.toThrow(
      "Provider not registered: unknown-provider",
    );
  });
});

describe("createDefaultProviderRuntime", () => {
  it("registers default Hermes and OpenClaw providers", async () => {
    const runtime = createDefaultProviderRuntime();
    const health = await runtime.getHealth();

    expect(health.some((entry) => entry.providerId === DEFAULT_HERMES_PROVIDER_ID)).toBe(
      true,
    );
    expect(health.some((entry) => entry.providerId === DEFAULT_OPENCLAW_PROVIDER_ID)).toBe(
      true,
    );
  });
});
