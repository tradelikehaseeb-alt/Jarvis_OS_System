import { afterEach, describe, expect, it, vi } from "vitest";

import {
  classifyOpenClawGatewayError,
  createOpenClawAdapterOfficial,
} from "../openclaw-adapter-official";
import type { OpenClawRequest } from "../../../src/openclaw-request";

const sampleRequest: OpenClawRequest = {
  requestId: "req-1",
  taskId: "task-1",
  userId: "user-1",
  intent: { kind: "automate", description: "Open example.com" },
  requestedActions: ["browser"],
};

const officialConfig = {
  adapterId: "openclaw-adapter-official",
  mode: "official" as const,
  sandboxRequired: true,
};

describe("classifyOpenClawGatewayError", () => {
  it("classifies connection refused as gateway down", () => {
    const result = classifyOpenClawGatewayError(
      new TypeError("fetch failed: ECONNREFUSED"),
      "http://127.0.0.1:18789",
    );
    expect(result.code).toBe("OPENCLAW_GATEWAY_DOWN");
    expect(result.retryable).toBe(true);
  });

  it("classifies abort as timeout", () => {
    const abort = new Error("aborted");
    abort.name = "AbortError";
    const result = classifyOpenClawGatewayError(
      abort,
      "http://127.0.0.1:18789",
      30_000,
    );
    expect(result.code).toBe("OPENCLAW_GATEWAY_TIMEOUT");
  });
});

describe("OpenClawAdapterOfficial", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("accepts gateway invoke when gateway responds", async () => {
    const fetchFn = vi.fn(async (url, init) => {
      expect(url).toBe("http://127.0.0.1:18789/tools/invoke");
      expect((init as RequestInit).method).toBe("POST");
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
      maxAttempts: 1,
    });

    const response = await adapter.invoke(sampleRequest, officialConfig);

    expect(response.success).toBe(true);
    expect(response.stub).toBe(false);
    expect(response.error).toBeUndefined();
    expect(response.execution.permissionsChecked).toBe(true);
    expect(response.gatewayPayload?.browserRuntime).toBeDefined();
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("returns gateway down error when gateway is unreachable (not stub error)", async () => {
    const fetchFn = vi.fn(async () => {
      throw new TypeError("fetch failed: connect ECONNREFUSED 127.0.0.1:18789");
    }) as unknown as typeof fetch;

    const adapter = createOpenClawAdapterOfficial({
      endpoint: "http://127.0.0.1:18789",
      fetchFn,
      maxAttempts: 2,
    });

    const response = await adapter.invoke(sampleRequest, officialConfig);

    expect(response.success).toBe(false);
    expect(response.stub).toBe(false);
    expect(response.error?.code).toBe("OPENCLAW_GATEWAY_DOWN");
    expect(response.error?.code).not.toBe("ADAPTER_NOT_CONFIGURED");
    expect(response.error?.message).toContain("not reachable");
    expect(response.error?.message).toContain("127.0.0.1:18789");
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("handles timeout after 30s with retry", async () => {
    vi.useFakeTimers();

    const fetchFn = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          const signal = init?.signal;
          if (!signal) {
            reject(new Error("missing signal"));
            return;
          }
          signal.addEventListener("abort", () => {
            const abortError = new Error("The operation was aborted");
            abortError.name = "AbortError";
            reject(abortError);
          });
        }),
    ) as unknown as typeof fetch;

    const adapter = createOpenClawAdapterOfficial({
      endpoint: "http://127.0.0.1:18789",
      fetchFn,
      timeoutMs: 30_000,
      maxAttempts: 2,
    });

    const invokePromise = adapter.invoke(sampleRequest, officialConfig);

    await vi.advanceTimersByTimeAsync(30_000);
    await vi.advanceTimersByTimeAsync(30_000);

    const response = await invokePromise;

    expect(response.success).toBe(false);
    expect(response.stub).toBe(false);
    expect(response.error?.code).toBe("OPENCLAW_GATEWAY_TIMEOUT");
    expect(fetchFn).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it("retries once on HTTP 503 then succeeds", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({
          success: true,
          handleId: "handle-retry",
          approvedActions: ["browser"],
        }),
      }) as unknown as typeof fetch;

    const adapter = createOpenClawAdapterOfficial({
      endpoint: "http://127.0.0.1:18789",
      fetchFn,
      maxAttempts: 2,
    });

    const response = await adapter.invoke(sampleRequest, officialConfig);

    expect(response.success).toBe(true);
    expect(response.stub).toBe(false);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("rejects when gateway returns policy failure", async () => {
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
      maxAttempts: 1,
    });

    const response = await adapter.invoke(sampleRequest, officialConfig);

    expect(response.success).toBe(false);
    expect(response.stub).toBe(false);
    expect(response.error?.code).toBe("POLICY_DENIED");
  });
});
