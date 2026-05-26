/**
 * Registered agent metadata (Hermes, OpenClaw gateway, etc.).
 * No agent implementations in Phase 2.
 */
export interface RegisteredAgent {
  readonly agentId: string;
  readonly displayName: string;
  readonly capabilities: readonly string[];
  /** When true, agent handles execution (e.g. OpenClaw gateway — sandbox in Phase 4). */
  readonly executionCapable: boolean;
}

/**
 * Resolves and lists agents available to the orchestrator.
 */
export interface AgentRegistry {
  readonly componentId: "agent-registry";
  list(): Promise<readonly RegisteredAgent[]>;
  resolve(agentId: string): Promise<RegisteredAgent | undefined>;
}
