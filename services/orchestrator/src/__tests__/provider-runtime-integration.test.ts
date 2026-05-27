import { describe, expect, it } from "vitest";

import {
  createDefaultProviderRuntime,
  DEFAULT_HERMES_PROVIDER_ID,
  DEFAULT_OPENCLAW_PROVIDER_ID,
} from "@jarvis/provider-runtime";

describe("Orchestrator provider runtime integration", () => {
  it("connects Hermes and OpenClaw provider paths for orchestrator handoff", async () => {
    const providerRuntime = createDefaultProviderRuntime();

    await providerRuntime.connect(DEFAULT_HERMES_PROVIDER_ID);
    await providerRuntime.connect(DEFAULT_OPENCLAW_PROVIDER_ID);

    expect(await providerRuntime.validateConnection(DEFAULT_HERMES_PROVIDER_ID)).toBe(
      true,
    );
    expect(await providerRuntime.validateConnection(DEFAULT_OPENCLAW_PROVIDER_ID)).toBe(
      true,
    );

    const health = await providerRuntime.getHealth();
    expect(health.filter((entry) => entry.connected)).toHaveLength(2);
  });
});
