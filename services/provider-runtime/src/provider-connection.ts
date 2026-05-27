/**
 * Provider connection lifecycle state (Phase 60).
 */
export type ProviderConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "failed";

/**
 * Active provider connection snapshot (Phase 60).
 */
export interface ProviderConnection {
  readonly providerId: string;
  readonly family: "hermes" | "openclaw";
  readonly state: ProviderConnectionState;
  readonly stub: boolean;
  readonly endpoint?: string;
  readonly connectedAt?: string;
  readonly disconnectedAt?: string;
  readonly lastError?: string;
}
