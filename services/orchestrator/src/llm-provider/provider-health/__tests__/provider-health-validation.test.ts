import { describe, expect, it, vi, afterEach } from "vitest";

import {
  createTestProviderHealthValidationRuntime,
  DEFAULT_CONNECTOR_CONFIGURATIONS,
  GROQ_PROVIDER_ID,
  OPENAI_PROVIDER_ID,
  OLLAMA_PROVIDER_ID,
} from "../../index";
import { DEFAULT_API_USER_ID } from "../../../task-execution";

describe("provider health validation", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns stub status when API key is missing", async () => {
    const runtime = createTestProviderHealthValidationRuntime();
    const result = await runtime.validateProviderHealth(
      OPENAI_PROVIDER_ID,
      DEFAULT_API_USER_ID,
    );

    expect(result.providerId).toBe(OPENAI_PROVIDER_ID);
    expect(result.stub).toBe(true);
    expect(result.connectionStatus).toBe("stub");
    expect(result.failureHandled).toBe(true);
    expect(result.configuredModels.length).toBeGreaterThan(0);
  });

  it("handles API probe failures gracefully", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    const runtime = createTestProviderHealthValidationRuntime();
    const result = await runtime.validateProviderHealth(
      GROQ_PROVIDER_ID,
      DEFAULT_API_USER_ID,
    );

    expect(result.connected).toBe(false);
    expect(result.failureHandled).toBe(true);
    expect(result.connectionStatus).toBe("stub");
    expect(result.message).toContain("API key not configured");
  });

  it("probes Ollama tags endpoint for model availability", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ models: [{ name: "llama3.2" }] }),
      }),
    );

    const runtime = createTestProviderHealthValidationRuntime();
    const result = await runtime.validateProviderHealth(
      OLLAMA_PROVIDER_ID,
      DEFAULT_API_USER_ID,
    );

    expect(result.connected).toBe(true);
    expect(result.availableModels).toContain("llama3.2");
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(result.failureHandled).toBe(true);
  });

  it("validates all seven configured providers", async () => {
    const runtime = createTestProviderHealthValidationRuntime();
    const results = await runtime.validateAllProviders(DEFAULT_API_USER_ID);

    expect(results).toHaveLength(DEFAULT_CONNECTOR_CONFIGURATIONS.length);
    expect(results.map((entry) => entry.providerId).sort()).toEqual(
      DEFAULT_CONNECTOR_CONFIGURATIONS.map((entry) => entry.providerId).sort(),
    );
  });
});
