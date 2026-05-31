import { describe, expect, it, vi } from "vitest";

import { createOpenClawAdapterOfficial } from "../openclaw-adapter-official";

describe("OpenClawAdapterOfficial", () => {
  it("accepts gateway invoke with token auth", async () => {
    const fetchFn = vi.fn(async (_url, init) => {
      expect((init as RequestInit).headers).toMatchObject({
        Authorization: "Bearer test-token",
      });
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({
          success: true,
          handleId: "handle-abc",
          approvedActions: ["browser"],
          browser: { action: "navigate", url: "https://example.com" },
        }),
      };
    }) as unknown as typeof fetch;

    const adapter = createOpenClawAdapterOfficial({
      endpoint: "http://127.0.0.1:18789",
      env: { OPENCLAW_GATEWAY_TOKEN: "test-token" },
      fetchFn,
    });

    const response = await adapter.invoke(
      {
        requestId: "req-1",
        taskId: "task-1",
        userId: "user-1",
        intent: { kind: "automate", description: "Open example.com" },
        requestedActions: ["browser"],
      },
      {
        adapterId: "openclaw-adapter-official",
        mode: "official",
        sandboxRequired: true,
      },
    );

    expect(response.success).toBe(true);
    expect(response.stub).toBe(false);
    expect(response.execution.permissionsChecked).toBe(true);
    expect(response.gatewayPayload?.browserRuntime).toBeDefined();
  });

  it("rejects when gateway returns failure", async () => {
    const fetchFn = vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({
        success: false,
        error: { code: "POLICY_DENIED", message: "Not allowed" },
      }),
    })) as unknown as typeof fetch;

    const adapter = createOpenClawAdapterOfficial({
      endpoint: "http://127.0.0.1:18789",
      fetchFn,
    });

    const response = await adapter.invoke(
      {
        requestId: "req-2",
        taskId: "task-2",
        userId: "user-1",
        intent: { kind: "automate", description: "Delete files" },
      },
      { adapterId: "openclaw-adapter-official", mode: "official", sandboxRequired: true },
    );

    expect(response.success).toBe(false);
    expect(response.error?.code).toBe("POLICY_DENIED");
  });
});
