import { describe, expect, it } from "vitest";

import {
  isJarvisRealProductionMode,
  isProviderProductionReady,
  resolveProviderStatusLabel,
} from "../production-mode";
import type { ProviderStatus } from "../../providers/provider-settings-types";

const baseProvider: ProviderStatus = {
  providerId: "openai",
  label: "OpenAI",
  kind: "openai",
  configured: false,
  valid: false,
  stub: true,
  active: false,
  message: "OpenAI API key not configured",
  selectedModel: "gpt-4o-mini",
  availableModels: ["gpt-4o-mini"],
};

describe("production-mode", () => {
  it("treats default vite profile as real production mode", () => {
    expect(isJarvisRealProductionMode()).toBe(true);
  });

  it("shows production label when provider is configured", () => {
    const provider = { ...baseProvider, configured: true, valid: true, stub: false };
    expect(isProviderProductionReady(provider)).toBe(true);
    expect(resolveProviderStatusLabel(provider)).toBe("Real Production Mode");
  });

  it("shows Active emerald token for active production provider", () => {
    const provider = {
      ...baseProvider,
      configured: true,
      valid: true,
      stub: false,
      active: true,
    };
    expect(resolveProviderStatusLabel(provider)).toBe("Active");
  });

  it("hides stub fallback label under global real mode", () => {
    expect(resolveProviderStatusLabel(baseProvider)).toBe("Real Production Mode");
  });
});
