import { describe, expect, it } from "vitest";

import {
  createDefaultProviderRuntime,
  DEFAULT_OPENCLAW_PROVIDER_ID,
} from "@jarvis/provider-runtime";

import { createOpenClawAdapterStub } from "../../../adapter/src/openclaw-adapter-stub";
import { DefaultOpenClawGateway } from "../../gateway/default-openclaw-gateway";

const request = {
  requestId: "req-provider-1",
  taskId: "task-provider-1",
  userId: "user-1",
  intent: { kind: "automate" as const, description: "Execute with provider runtime" },
  contextRef: "ctx-provider-1",
  requestedActions: ["browser", "file"] as const,
};

describe("OpenClaw provider runtime integration", () => {
  it("executes through provider connection path", async () => {
    const providerRuntime = createDefaultProviderRuntime();
    await providerRuntime.connect(DEFAULT_OPENCLAW_PROVIDER_ID);

    const gateway = new DefaultOpenClawGateway({
      env: { OPENCLAW_MODE: "stub" },
      adapter: createOpenClawAdapterStub(),
      providerRuntime,
    });

    const response = await gateway.execute(request);
    expect(response.success).toBe(true);
    expect(response.stub).toBe(true);
    expect(response.executionHandleId).toBe("handle-stub-task-provider-1");
  });
});
