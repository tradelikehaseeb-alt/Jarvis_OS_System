/** Connection status for an LLM provider health probe (Phase 85). */
export type ProviderConnectionStatus =
  | "connected"
  | "stub"
  | "unreachable"
  | "misconfigured";

/** Point-in-time health snapshot for a configured LLM provider (Phase 85). */
export interface ProviderHealthSnapshot {
  readonly providerId: string;
  readonly label: string;
  readonly connected: boolean;
  readonly stub: boolean;
  readonly connectionStatus: ProviderConnectionStatus;
  readonly availableModels: readonly string[];
  readonly configuredModels: readonly string[];
  readonly latencyMs: number;
  readonly failureHandled: boolean;
  readonly message: string;
  readonly checkedAt: string;
}
