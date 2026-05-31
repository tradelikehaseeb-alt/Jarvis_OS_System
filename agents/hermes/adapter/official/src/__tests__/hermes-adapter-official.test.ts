import { describe, expect, it, vi } from "vitest";

import { createHermesAdapterOfficial } from "../hermes-adapter-official";

describe("HermesAdapterOfficial", () => {
  it("maps official plan HTTP response to HermesResponse", async () => {
    const fetchFn = vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({
        goal: "Plan the sprint",
        steps: ["Gather requirements", "Schedule work"],
        reasoning: { summary: "Structured plan", confidence: 0.9 },
      }),
    })) as unknown as typeof fetch;

    const adapter = createHermesAdapterOfficial({
      endpoint: "http://127.0.0.1:8080",
      fetchFn,
    });

    const response = await adapter.invoke(
      {
        requestId: "req-1",
        taskId: "task-1",
        userId: "user-1",
        intent: { kind: "plan", description: "Plan the sprint" },
      },
      { adapterId: "hermes-adapter-official", mode: "official" },
    );

    expect(response.success).toBe(true);
    expect(response.stub).toBe(false);
    expect(response.plan.steps).toHaveLength(2);
    expect(fetchFn).toHaveBeenCalledOnce();
  });

  it("returns error when HTTP fails", async () => {
    const fetchFn = vi.fn(async () => ({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      json: async () => ({}),
    })) as unknown as typeof fetch;

    const adapter = createHermesAdapterOfficial({
      endpoint: "http://127.0.0.1:8080",
      fetchFn,
    });

    const response = await adapter.invoke(
      {
        requestId: "req-2",
        taskId: "task-2",
        userId: "user-1",
        intent: { kind: "automate", description: "Open Gmail" },
      },
      { adapterId: "hermes-adapter-official", mode: "official" },
    );

    expect(response.success).toBe(false);
    expect(response.error?.code).toBe("HERMES_OFFICIAL_HTTP_ERROR");
  });
});
