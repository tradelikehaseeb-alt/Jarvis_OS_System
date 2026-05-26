import type { ProviderMetadata } from "./provider-metadata";

/** Static catalog — all Phase 17 providers (stub only). */
export const DEFAULT_PROVIDER_CATALOG: readonly ProviderMetadata[] = [
  {
    providerId: "hermes-local",
    family: "hermes",
    displayName: "Hermes (local)",
    deployment: "local",
    stub: true,
    description: "Local Hermes stub — no LLM, no network",
  },
  {
    providerId: "hermes-cloud",
    family: "hermes",
    displayName: "Hermes (cloud)",
    deployment: "cloud",
    stub: true,
    description: "Cloud Hermes stub placeholder — official API not wired",
  },
  {
    providerId: "openclaw-local",
    family: "openclaw",
    displayName: "OpenClaw (local gateway)",
    deployment: "local",
    stub: true,
    description: "Local OpenClaw gateway stub — no automation",
  },
  {
    providerId: "openclaw-remote",
    family: "openclaw",
    displayName: "OpenClaw (remote gateway)",
    deployment: "remote",
    stub: true,
    description: "Remote OpenClaw gateway stub placeholder — not wired",
  },
] as const;

/** Register all default providers into a registry instance. */
export function registerDefaultProviders(
  registry: { register(metadata: ProviderMetadata): void },
): void {
  for (const metadata of DEFAULT_PROVIDER_CATALOG) {
    registry.register(metadata);
  }
}
