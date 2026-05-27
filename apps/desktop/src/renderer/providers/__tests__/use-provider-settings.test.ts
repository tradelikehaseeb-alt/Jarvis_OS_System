import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createMockJarvisApi } from "../../test/mock-jarvis-api";
import { useProviderSettings } from "../use-provider-settings";

describe("useProviderSettings", () => {
  beforeEach(() => {
    window.jarvis = createMockJarvisApi();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads provider settings snapshot", async () => {
    const { result } = renderHook(() => useProviderSettings());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.providers.length).toBeGreaterThan(0);
    expect(result.current.activeProviderId).toBe("openai");
  });

  it("saves api key through bridge", async () => {
    const { result } = renderHook(() => useProviderSettings());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const validation = await result.current.saveApiKey(
      "openai",
      "sk-test-key-12345678",
    );

    expect(validation.valid).toBe(true);
    expect(window.jarvis.saveProviderApiKey).toHaveBeenCalled();
  });
});
