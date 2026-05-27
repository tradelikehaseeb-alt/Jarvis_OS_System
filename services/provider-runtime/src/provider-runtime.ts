import type { ProviderConnection } from "./provider-connection";
import type { ProviderHealth } from "./provider-health";
import type { ProviderSession } from "./provider-session";

/**
 * Provider connection runtime contract (Phase 60).
 */
export interface ProviderRuntime {
  connect(providerId: string): Promise<ProviderSession>;
  disconnect(providerId: string): Promise<ProviderConnection>;
  validateConnection(providerId: string): Promise<boolean>;
  getHealth(): Promise<readonly ProviderHealth[]>;
  getHealthFor(providerId: string): Promise<ProviderHealth | undefined>;
}
