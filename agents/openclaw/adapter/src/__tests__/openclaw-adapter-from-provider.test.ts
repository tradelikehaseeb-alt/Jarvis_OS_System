import { afterEach, describe, expect, it, vi } from "vitest";

import { createDefaultProviderResolver } from "@jarvis/provider-registry";

import {
  createOpenClawAdapterFromProvider,
  resolveOpenClawInnerAdapter,
} from "../create-openclaw-adapter-from-provider";
import { isOpenClawAdapterOfficial } from "../../official/src/openclaw-adapter-official";
import type { OpenClawRequest } from "../openclaw-request";

const request: OpenClawRequest = {
  requestId: "req-p2",
  taskId: "task-p2",
  userId: "user-1",
  intent: { kind: "automate", description: "Run workflow" },
  contextRef: "ctx-1",
};

describe("resolveOpenClawInnerAdapter", () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
    vi.restoreAllMocks();
  });

  it("returns OpenClawAdapterOfficial when OPENCLAW_MODE=official", () => {
    process.env.OPENCLAW_MODE = "official";
    process.env.OPENCLAW_GATEWAY_URL = "http://127.0.0.1:18789";
    process.env.OPENCLAW_INTEGRATION_LIVE = "true";
    const adapter = resolveOpenClawInnerAdapter(process.env);
    expect(isOpenClawAdapterOfficial(adapter)).toBe(true);
  });

  it("returns stub adapter when OPENCLAW_MODE=stub", () => {
    process.env.OPENCLAW_MODE = "stub";
    delete process.env.OPENCLAW_INTEGRATION_LIVE;
    const adapter = resolveOpenClawInnerAdapter(process.env);
    expect(isOpenClawAdapterOfficial(adapter)).toBe(false);
    expect(adapter.adapterId).toBeDefined();
  });
});

describe("createOpenClawAdapterFromProvider", () => {
  it("uses openclaw-remote when configured with stub inner", async () => {
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

  it("invokes official gateway when OPENCLAW_MODE=official", async () => {
    const fetchFn = vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({
        success: true,
        handleId: "handle-official",
        approvedActions: ["browser"],
      }),
    })) as unknown as typeof fetch;

    const resolver = createDefaultProviderResolver();
    const { createOpenClawAdapterOfficial } = await import(
      "../../official/src/openclaw-adapter-official"
    );
    const adapter = createOpenClawAdapterFromProvider(
      resolver,
      createOpenClawAdapterOfficial({
        endpoint: "http://127.0.0.1:18789",
        fetchFn,
        maxAttempts: 1,
      }),
    );

    const response = await adapter.invoke(request, {
      adapterId: "openclaw-local",
      mode: "official",
      sandboxRequired: true,
      gatewayEndpoint: "http://127.0.0.1:18789",
    });

    expect(response.success).toBe(true);
    expect(response.stub).toBe(false);
    expect(fetchFn).toHaveBeenCalledWith(
      "http://127.0.0.1:18789/tools/invoke",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
