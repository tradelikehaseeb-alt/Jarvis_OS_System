import type { ProviderConnection } from "./provider-connection";

/**
 * Provider connection session (Phase 60).
 */
export interface ProviderSession {
  readonly sessionId: string;
  readonly providerId: string;
  readonly connection: ProviderConnection;
}
