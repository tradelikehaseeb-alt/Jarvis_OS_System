import { describe, expect, it } from "vitest";

import {
  DEFAULT_PROVIDER_CATALOG,
  DEFAULT_PROVIDER_CONFIG,
  InMemoryProviderRegistry,
  ProviderResolver,
  createDefaultProviderRegistry,
  createDefaultProviderResolver,
  registerDefaultProviders,
  validateProviderConfig,
} from "../index";

describe("InMemoryProviderRegistry", () => {
  it("registers all default providers", () => {
    const registry = createDefaultProviderRegistry();
    expect(registry.list()).toHaveLength(4);
    expect(registry.resolve("hermes-local")).toBeDefined();
    expect(registry.resolve("openclaw-remote")).toBeDefined();
  });

  it("lists by family", () => {
    const registry = createDefaultProviderRegistry();
    expect(registry.listByFamily("hermes")).toHaveLength(2);
    expect(registry.listByFamily("openclaw")).toHaveLength(2);
  });
});

describe("ProviderResolver", () => {
  it("resolves configured hermes-local with mock payload", () => {
    const resolver = createDefaultProviderResolver();
    const resolution = resolver.resolveHermes();

    expect(resolution.metadata.providerId).toBe("hermes-local");
    expect(resolution.stub).toBe(true);
    expect(resolution.stubPayload.ready).toBe(true);
    expect(resolution.stubPayload.endpoint).toContain("hermes-local");
  });

  it("resolves hermes-cloud when configured", () => {
    const resolver = createDefaultProviderResolver({
      ...DEFAULT_PROVIDER_CONFIG,
      hermesProviderId: "hermes-cloud",
    });
    const resolution = resolver.resolveHermes();

    expect(resolution.metadata.deployment).toBe("cloud");
    expect(resolution.stubPayload.endpoint).toContain("stub.cloud");
  });

  it("resolves openclaw-remote when configured", () => {
    const resolver = createDefaultProviderResolver({
      ...DEFAULT_PROVIDER_CONFIG,
      openclawProviderId: "openclaw-remote",
    });
    const resolution = resolver.resolveOpenClaw();

    expect(resolution.metadata.providerId).toBe("openclaw-remote");
    expect(resolution.metadata.deployment).toBe("remote");
  });

  it("throws when provider is not registered", () => {
    const registry = new InMemoryProviderRegistry();
    registerDefaultProviders(registry);
    registry.resolve("hermes-local");

    const empty = new InMemoryProviderRegistry();
    const resolver = new ProviderResolver(empty, DEFAULT_PROVIDER_CONFIG);

    expect(() => resolver.resolveHermes()).toThrow(/not registered/);
  });
});

describe("validateProviderConfig", () => {
  it("accepts default config against default registry", () => {
    const registry = createDefaultProviderRegistry();
    expect(() =>
      validateProviderConfig(DEFAULT_PROVIDER_CONFIG, registry),
    ).not.toThrow();
  });

  it("catalog matches expected provider ids", () => {
    const ids = DEFAULT_PROVIDER_CATALOG.map((p) => p.providerId).sort();
    expect(ids).toEqual(
      [
        "hermes-cloud",
        "hermes-local",
        "openclaw-local",
        "openclaw-remote",
      ].sort(),
    );
  });
});
