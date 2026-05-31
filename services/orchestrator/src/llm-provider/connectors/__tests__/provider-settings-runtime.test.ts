import { describe, expect, it } from "vitest";

import {
  InMemoryProviderCredentialStore,
  createTestProviderSettingsRuntime,
  GROQ_PROVIDER_ID,
  OPENAI_PROVIDER_ID,
} from "../index";

describe("ProviderCredentialStore", () => {
  it("stores and retrieves keys without exposing in status APIs", () => {
    const store = new InMemoryProviderCredentialStore();
    store.saveApiKey("user-1", OPENAI_PROVIDER_ID, "sk-test-key-12345678");

    expect(store.getApiKey("user-1", OPENAI_PROVIDER_ID)).toBe(
      "sk-test-key-12345678",
    );
    expect(store.hasApiKey("user-1", OPENAI_PROVIDER_ID)).toBe(true);
    expect(store.listConfiguredProviderIds("user-1")).toEqual([OPENAI_PROVIDER_ID]);
  });

  it("deletes stored keys", () => {
    const store = new InMemoryProviderCredentialStore();
    store.saveApiKey("user-1", GROQ_PROVIDER_ID, "gsk-test-key-12345678");
    expect(store.deleteApiKey("user-1", GROQ_PROVIDER_ID)).toBe(true);
    expect(store.hasApiKey("user-1", GROQ_PROVIDER_ID)).toBe(false);
  });
});

describe("ProviderSettingsRuntime", () => {
  const runtime = createTestProviderSettingsRuntime();

  it("saveApiKey validates and persists credentials", async () => {
    const result = await runtime.saveApiKey(
      "user-1",
      GROQ_PROVIDER_ID,
      "gsk-test-key-12345678",
    );

    expect(result.valid).toBe(true);
    expect(result.stub).toBe(false);

    const status = await runtime.getProviderStatus("user-1", GROQ_PROVIDER_ID);
    expect(status.configured).toBe(true);
    expect(status.valid).toBe(true);
    expect(JSON.stringify(status)).not.toContain("gsk-test-key");
  });

  it("selectProvider and selectModel persist user preferences", async () => {
    const settings = runtime.selectProvider("user-2", GROQ_PROVIDER_ID);
    expect(settings.selectedProviderId).toBe(GROQ_PROVIDER_ID);

    const withModel = runtime.selectModel(
      "user-2",
      GROQ_PROVIDER_ID,
      "llama-3.3-70b-versatile",
    );
    expect(withModel.selectedModels[GROQ_PROVIDER_ID]).toBe(
      "llama-3.3-70b-versatile",
    );

    const status = await runtime.getProviderStatus("user-2", GROQ_PROVIDER_ID);
    expect(status.active).toBe(true);
    expect(status.selectedModel).toBe("llama-3.3-70b-versatile");
  });

  it("listProviderStatuses returns all registered providers", async () => {
    const statuses = await runtime.listProviderStatuses("user-3");
    expect(statuses.length).toBeGreaterThanOrEqual(8);
    expect(statuses.every((entry) => !JSON.stringify(entry).includes("sk-"))).toBe(
      true,
    );
  });

  it("resolveProviderId prefers metadata override", () => {
    runtime.selectProvider("user-4", OPENAI_PROVIDER_ID);
    const resolved = runtime.resolveProviderId("user-4", {
      llmProviderId: GROQ_PROVIDER_ID,
    });
    expect(resolved).toBe(GROQ_PROVIDER_ID);
  });

  it("executePrompt uses stub fallback without configured key", async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.JARVIS_OPENAI_API_KEY;

    runtime.selectProvider("user-5", OPENAI_PROVIDER_ID);
    const response = await runtime.executePrompt({
      providerId: OPENAI_PROVIDER_ID,
      prompt: "Plan workflow",
      userId: "user-5",
    });

    expect(response.stub).toBe(true);
    expect(response.success).toBe(false);
    expect(response.error?.code).toBe("PROVIDER_KEY_MISSING");
    expect(response.content).toBe("");
  });
});
