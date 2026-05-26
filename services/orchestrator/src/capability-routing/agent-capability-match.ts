/**
 * Score result for matching a {@link TaskIntent} to agent registry metadata.
 */
export interface AgentCapabilityMatch {
  readonly agentId: string;
  readonly displayName: string;
  /** Capability tokens from registry that matched the intent profile. */
  readonly matchedCapabilities: readonly string[];
  /** Deterministic stub score 0–1 (Phase 12 — not ML). */
  readonly score: number;
  readonly executionCapable: boolean;
}
