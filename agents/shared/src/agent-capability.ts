/**
 * Capability kind — what an agent is allowed to advertise to the registry.
 */
export type AgentCapabilityKind =
  | "planning"
  | "reasoning"
  | "memory-access"
  | "task-decomposition"
  | "execution"
  | "browser-automation"
  | "desktop-automation";

/**
 * A single capability entry on {@link AgentMetadata}.
 */
export interface AgentCapability {
  readonly id: string;
  readonly kind: AgentCapabilityKind;
  readonly description: string;
}
