import { describe, expect, it } from "vitest";

import {
  OpenClawAdapterStub,
  DEFAULT_OPENCLAW_CONFIG,
  type OpenClawRequest,
} from "../index";

const sampleRequest: OpenClawRequest = {
  requestId: "req-2",
  taskId: "task-2",
  userId: "user-1",
  intent: { kind: "automate", description: "Open dashboard" },
  contextRef: "ctx-2",
  requestedActions: ["browser", "file"],
};

describe("OpenClawAdapterStub", () => {
  it("returns static accepted execution handle", async () => {
    const adapter = new OpenClawAdapterStub();
    const response = await adapter.invoke(sampleRequest);

    expect(response.success).toBe(true);
    expect(response.stub).toBe(true);
    expect(response.adapterId).toBe(DEFAULT_OPENCLAW_CONFIG.adapterId);
    expect(response.execution.status).toBe("accepted");
    expect(response.execution.sandbox).toBe(true);
    expect(response.approvedActions).toEqual(["browser", "file"]);
  });

  it("rejects official mode until implemented", async () => {
    const adapter = new OpenClawAdapterStub();
    const response = await adapter.invoke(sampleRequest, {
      adapterId: "openclaw-official",
      mode: "official",
      sandboxRequired: true,
      gatewayEndpoint: "https://example.invalid",
    });

    expect(response.success).toBe(false);
    expect(response.error?.code).toBe("ADAPTER_NOT_CONFIGURED");
  });
});
