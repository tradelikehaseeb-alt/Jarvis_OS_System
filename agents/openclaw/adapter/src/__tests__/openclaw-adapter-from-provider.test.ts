import { describe, expect, it } from "vitest";

import { createDefaultProviderResolver } from "@jarvis/provider-registry";

import { createOpenClawAdapterFromProvider } from "../create-openclaw-adapter-from-provider";
import type { OpenClawRequest } from "../openclaw-request";

const request: OpenClawRequest = {
  requestId: "req-p2",
  taskId: "task-p2",
  userId: "user-1",
  intent: { kind: "automate", description: "Run workflow" },
  contextRef: "ctx-1",
};

describe("createOpenClawAdapterFromProvider", () => {
  it("uses openclaw-remote when configured", async () => {
    const resolver = createDefaultProviderResolver({
      hermesProviderId: "hermes-local",
      openclawProviderId: "openclaw-remote",
    });
    const adapter = createOpenClawAdapterFromProvider(resolver);
    const response = await adapter.invoke(request);

    expect(response.adapterId).toBe("openclaw-remote");
    expect(response.execution.handleId).toContain("openclaw-remote");
    expect(response.approvedActions[0]).toContain("remote");
  });
});
