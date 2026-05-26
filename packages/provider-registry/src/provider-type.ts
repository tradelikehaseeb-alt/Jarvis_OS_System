/**
 * Registered external provider identifiers (Phase 17).
 *
 * Official Hermes/OpenClaw integrations map to these ids without changing adapter interfaces.
 */
export type HermesProviderType = "hermes-local" | "hermes-cloud";

export type OpenClawProviderType = "openclaw-local" | "openclaw-remote";

/** All supported provider type literals. */
export type ProviderType = HermesProviderType | OpenClawProviderType;

/** Provider family for filtering registry entries. */
export type ProviderFamily = "hermes" | "openclaw";

/** Type guard — Hermes family provider ids. */
export function isHermesProviderType(id: ProviderType): id is HermesProviderType {
  return id === "hermes-local" || id === "hermes-cloud";
}

/** Type guard — OpenClaw family provider ids. */
export function isOpenClawProviderType(
  id: ProviderType,
): id is OpenClawProviderType {
  return id === "openclaw-local" || id === "openclaw-remote";
}
