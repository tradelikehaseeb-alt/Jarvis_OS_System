import { describe, expect, it } from "vitest";

import { createDefaultProviderResolver } from "@jarvis/provider-registry";

import { createHermesAdapterFromProvider } from "../create-hermes-adapter-from-provider";
import type { HermesRequest } from "../hermes-request";

const request: HermesRequest = {
  requestId: "req-p1",
  taskId: "task-p1",
  userId: "user-1",
  intent: { kind: "plan", description: "Plan sprint" },
};

describe("createHermesAdapterFromProvider", () => {
  it("uses hermes-cloud when configured", async () => {
    const resolver = createDefaultProviderResolver({
      hermesProviderId: "hermes-cloud",
      openclawProviderId: "openclaw-local",
    });
    const adapter = createHermesAdapterFromProvider(resolver);
    const response = await adapter.invoke(request);

    expect(response.adapterId).toBe("hermes-cloud");
    expect(response.plan.summary).toContain("Hermes (cloud)");
    expect(response.reasoning.summary).toContain("[cloud]");
  });
});
