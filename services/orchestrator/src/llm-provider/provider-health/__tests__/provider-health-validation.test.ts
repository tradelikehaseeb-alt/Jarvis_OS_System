import { describe, expect, it, vi } from "vitest";

import {
  createTestProviderHealthValidationRuntime,
  DEFAULT_CONNECTOR_CONFIGURATIONS,
  GROQ_PROVIDER_ID,
  OPENAI_PROVIDER_ID,
  OLLAMA_PROVIDER_ID,
} from "../../index";
import { DEFAULT_API_USER_ID } from "../../../task-execution";

describe("provider health validation", () => {
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
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new Error("network down"));

    try {
      const runtime = createTestProviderHealthValidationRuntime();
      const result = await runtime.validateProviderHealth(
        GROQ_PROVIDER_ID,
        DEFAULT_API_USER_ID,
      );

      expect(result.connected).toBe(false);
      expect(result.failureHandled).toBe(true);
      expect(result.connectionStatus).toBe("stub");
      expect(result.message).toContain("API key not configured");
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("probes Ollama tags endpoint for model availability", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ models: [{ name: "llama3.2" }] }),
    } as Response);

    try {
      const runtime = createTestProviderHealthValidationRuntime();
      const result = await runtime.validateProviderHealth(
        OLLAMA_PROVIDER_ID,
        DEFAULT_API_USER_ID,
      );

      expect(result.connected).toBe(true);
      expect(result.availableModels).toContain("llama3.2");
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.failureHandled).toBe(true);
    } finally {
      fetchSpy.mockRestore();
    }
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
