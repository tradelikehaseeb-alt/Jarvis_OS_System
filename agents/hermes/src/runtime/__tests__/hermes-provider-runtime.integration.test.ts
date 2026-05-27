import { describe, expect, it } from "vitest";

import {
  createDefaultProviderRuntime,
  DEFAULT_HERMES_PROVIDER_ID,
} from "@jarvis/provider-runtime";
import { createHermesAdapterStub } from "../../../adapter/src/hermes-adapter-stub";
import { DefaultHermesGateway } from "../../gateway/default-hermes-gateway";

const request = {
  requestId: "req-provider-1",
  taskId: "task-provider-1",
  userId: "user-1",
  intent: { kind: "plan" as const, description: "Plan with provider runtime" },
  contextRef: "ctx-provider-1",
};

describe("Hermes provider runtime integration", () => {
  it("executes through provider connection path", async () => {
    const providerRuntime = createDefaultProviderRuntime();
    await providerRuntime.connect(DEFAULT_HERMES_PROVIDER_ID);

    const gateway = new DefaultHermesGateway({
      env: { HERMES_MODE: "stub" },
      adapter: createHermesAdapterStub(),
      providerRuntime,
    });

    const response = await gateway.execute(request);
    expect(response.success).toBe(true);
    expect(response.stub).toBe(true);
    expect(response.plan.goal).toBe("Plan with provider runtime");
  });
});
