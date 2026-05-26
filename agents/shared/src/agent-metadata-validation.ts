import type { BaseAgent } from "./base-agent";
import type { AgentMetadata } from "./agent-metadata";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validate agent metadata shape before registry registration/use.
 * Throws descriptive errors for malformed metadata to fail fast in bootstrap.
 */
export function assertValidAgentMetadata(
  metadata: AgentMetadata | undefined,
  source: string,
): asserts metadata is AgentMetadata {
  if (!metadata) {
    throw new Error(`[${source}] Agent metadata is missing`);
  }
  if (!isNonEmptyString(metadata.agentId)) {
    throw new Error(`[${source}] Agent metadata.agentId is missing or empty`);
  }
  if (!isNonEmptyString(metadata.displayName)) {
    throw new Error(
      `[${source}] Agent ${metadata.agentId} metadata.displayName is missing or empty`,
    );
  }
  if (!Array.isArray(metadata.capabilities)) {
    throw new Error(
      `[${source}] Agent ${metadata.agentId} metadata.capabilities must be an array`,
    );
  }
  if (metadata.capabilities.length === 0) {
    throw new Error(
      `[${source}] Agent ${metadata.agentId} must declare at least one capability`,
    );
  }
  for (const capability of metadata.capabilities) {
    if (!isNonEmptyString(capability.id) || !isNonEmptyString(capability.kind)) {
      throw new Error(
        `[${source}] Agent ${metadata.agentId} has invalid capability entry`,
      );
    }
  }
}

/**
 * Validate a live agent instance and return normalized metadata.
 */
export function assertValidAgentInstance(
  agent: BaseAgent,
  source: string,
): AgentMetadata {
  const metadata = agent.metadata;
  assertValidAgentMetadata(metadata, source);
  return metadata;
}
