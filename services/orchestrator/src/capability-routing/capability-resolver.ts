import type { TaskIntent } from "@jarvis/types";

import type { RegisteredAgent } from "../agent-registry/contract";
import type { AgentCapabilityMatch } from "./agent-capability-match";
import { requiredCapabilitiesForIntent } from "./intent-capability-profile";

/**
 * Input for capability resolution.
 */
export interface CapabilityResolverInput {
  readonly taskId: string;
  readonly intent: TaskIntent;
  readonly agents: readonly RegisteredAgent[];
}

/**
 * Matches {@link TaskIntent} against agent registry capability metadata.
 */
export interface CapabilityResolver {
  readonly componentId: "capability-resolver";

  resolve(input: CapabilityResolverInput): Promise<readonly AgentCapabilityMatch[]>;
}

/** Stub score: overlap count / required count (deterministic). */
export function scoreCapabilityOverlap(
  agentCapabilities: readonly string[],
  required: readonly string[],
): { matched: string[]; score: number } {
  const matched = required.filter((cap) => agentCapabilities.includes(cap));
  const score =
    required.length === 0 ? 0 : matched.length / required.length;
  return { matched, score };
}

/**
 * Static resolver — registry metadata only (Phase 12).
 */
export class CapabilityResolverStub implements CapabilityResolver {
  readonly componentId = "capability-resolver" as const;

  async resolve(
    input: CapabilityResolverInput,
  ): Promise<readonly AgentCapabilityMatch[]> {
    const required = requiredCapabilitiesForIntent(input.intent);

    return input.agents
      .map((agent) => {
        const { matched, score } = scoreCapabilityOverlap(
          agent.capabilities,
          required,
        );
        return {
          agentId: agent.agentId,
          displayName: agent.displayName,
          matchedCapabilities: matched,
          score,
          executionCapable: agent.executionCapable,
        } satisfies AgentCapabilityMatch;
      })
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score);
  }
}
