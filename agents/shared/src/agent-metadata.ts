import type { AgentCapability } from "./agent-capability";

/**
 * Static descriptor for a registered agent (Hermes, OpenClaw gateway, etc.).
 * Implementations supply metadata; orchestrator resolves by agentId.
 */
export interface AgentMetadata {
  readonly agentId: string;
  readonly displayName: string;
  readonly version: string;
  readonly capabilities: readonly AgentCapability[];
  /**
   * When true, agent may trigger execution paths (e.g. OpenClaw gateway).
   * Requires sandbox and permission checks at execution time (Phase 9+).
   */
  readonly executionCapable: boolean;
}
