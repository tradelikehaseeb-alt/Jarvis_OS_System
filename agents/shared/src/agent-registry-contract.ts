import type { BaseAgent } from "./base-agent";
import type { AgentMetadata } from "./agent-metadata";

/**
 * Agent-layer registry contract — lists and resolves {@link BaseAgent} instances.
 *
 * Distinct from orchestrator `AgentRegistry` (orchestrator service module).
 * Wiring between the two registries happens in Phase 9+.
 */
export interface AgentRegistryContract {
  readonly contractId: "agent-registry";

  /** Register an agent implementation (startup / plugin load). */
  register(agent: BaseAgent): Promise<void>;

  /** Remove agent by id. */
  unregister(agentId: string): Promise<boolean>;

  /** Resolve agent by id. */
  resolve(agentId: string): Promise<BaseAgent | undefined>;

  /** List metadata for all registered agents. */
  list(): Promise<readonly AgentMetadata[]>;
}
