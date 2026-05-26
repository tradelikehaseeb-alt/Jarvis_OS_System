import { describe, expect, it } from "vitest";

import {
  HermesAdapterStub,
  DEFAULT_HERMES_CONFIG,
  type HermesRequest,
} from "../index";

const sampleRequest: HermesRequest = {
  requestId: "req-1",
  taskId: "task-1",
  userId: "user-1",
  intent: { kind: "research", description: "Find API docs" },
  contextRef: "ctx-1",
};

describe("HermesAdapterStub", () => {
  it("returns static plan and reasoning", async () => {
    const adapter = new HermesAdapterStub();
    const response = await adapter.invoke(sampleRequest);

    expect(response.success).toBe(true);
    expect(response.stub).toBe(true);
    expect(response.adapterId).toBe(DEFAULT_HERMES_CONFIG.adapterId);
    expect(response.plan.goal).toBe("Find API docs");
    expect(response.plan.steps.length).toBeGreaterThan(0);
    expect(response.plan.intentKind).toBe("research");
    expect(response.reasoning.confidence).toBeGreaterThan(0);
  });

  it("rejects official mode until implemented", async () => {
    const adapter = new HermesAdapterStub();
    const response = await adapter.invoke(sampleRequest, {
      adapterId: "hermes-official",
      mode: "official",
      endpoint: "https://example.invalid",
    });

    expect(response.success).toBe(false);
    expect(response.error?.code).toBe("ADAPTER_NOT_CONFIGURED");
  });
});
