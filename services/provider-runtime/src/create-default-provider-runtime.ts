import { InMemoryProviderRegistry } from "./provider-registry";
import { InMemoryProviderRuntime } from "./in-memory-provider-runtime";
import type { ProviderRegistry } from "./provider-registry";
import type { ProviderRuntime } from "./provider-runtime";

/** Default Hermes provider id for stub connection path (Phase 60). */
export const DEFAULT_HERMES_PROVIDER_ID = "hermes-local" as const;

/** Default OpenClaw provider id for stub connection path (Phase 60). */
export const DEFAULT_OPENCLAW_PROVIDER_ID = "openclaw-local" as const;

export interface DefaultProviderRuntimeOptions {
  readonly registry?: ProviderRegistry;
}

const DEFAULT_ENTRIES = [
  {
    providerId: DEFAULT_HERMES_PROVIDER_ID,
    family: "hermes" as const,
    label: "Hermes (local)",
    stub: true,
    endpoint: "stub://hermes-local",
  },
  {
    providerId: "hermes-cloud",
    family: "hermes" as const,
    label: "Hermes (cloud)",
    stub: true,
    endpoint: "stub://hermes-cloud",
  },
  {
    providerId: DEFAULT_OPENCLAW_PROVIDER_ID,
    family: "openclaw" as const,
    label: "OpenClaw (local gateway)",
    stub: true,
    endpoint: "stub://openclaw-local",
  },
  {
    providerId: "openclaw-remote",
    family: "openclaw" as const,
    label: "OpenClaw (remote gateway)",
    stub: true,
    endpoint: "stub://openclaw-remote",
  },
];

/**
 * Factory for default in-memory provider runtime with stub connections (Phase 60).
 */
export function createDefaultProviderRuntime(
  options?: DefaultProviderRuntimeOptions,
): ProviderRuntime {
  const registry = options?.registry ?? new InMemoryProviderRegistry();

  if (registry.list().length === 0) {
    for (const entry of DEFAULT_ENTRIES) {
      registry.register(entry);
    }
  }

  return new InMemoryProviderRuntime(registry);
}
