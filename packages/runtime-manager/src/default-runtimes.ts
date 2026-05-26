import type { ProviderType } from "@jarvis/provider-registry";

import { MockRuntimeProvider } from "./mock-runtime-provider";
import type { RuntimeProvider } from "./runtime-provider";

/** All supported external runtime ids (Phase 20). */
export const SUPPORTED_RUNTIME_IDS: readonly ProviderType[] = [
  "hermes-local",
  "hermes-cloud",
  "openclaw-local",
  "openclaw-remote",
] as const;

/** Create mock providers for every supported runtime id. */
export function createDefaultMockRuntimeProviders(): RuntimeProvider[] {
  return SUPPORTED_RUNTIME_IDS.map((id) => new MockRuntimeProvider(id));
}
