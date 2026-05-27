import { describe, expect, it } from "vitest";

import {
  createDefaultProviderRuntime,
  DEFAULT_HERMES_PROVIDER_ID,
  DEFAULT_OPENCLAW_PROVIDER_ID,
} from "../index";

describe("Provider runtime integration", () => {
  it("models Hermes and OpenClaw provider connection path", async () => {
    const runtime = createDefaultProviderRuntime();

    const hermesSession = await runtime.connect(DEFAULT_HERMES_PROVIDER_ID);
    const openclawSession = await runtime.connect(DEFAULT_OPENCLAW_PROVIDER_ID);

    expect(hermesSession.connection.family).toBe("hermes");
    expect(openclawSession.connection.family).toBe("openclaw");

    expect(await runtime.validateConnection(DEFAULT_HERMES_PROVIDER_ID)).toBe(true);
    expect(await runtime.validateConnection(DEFAULT_OPENCLAW_PROVIDER_ID)).toBe(true);

    const health = await runtime.getHealth();
    expect(health.filter((entry) => entry.connected)).toHaveLength(2);

    await runtime.disconnect(DEFAULT_HERMES_PROVIDER_ID);
    await runtime.disconnect(DEFAULT_OPENCLAW_PROVIDER_ID);

    const hermesHealth = await runtime.getHealthFor(DEFAULT_HERMES_PROVIDER_ID);
    expect(hermesHealth?.connected).toBe(false);
    expect(hermesHealth?.status).toBe("unavailable");
  });
});
