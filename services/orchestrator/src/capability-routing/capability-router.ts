import type { TaskIntent } from "@jarvis/types";

import type { AgentRegistry } from "../agent-registry/contract";
import type { AgentCapabilityMatch } from "./agent-capability-match";
import type { AgentSelectionPolicy } from "./agent-selection-policy";
import type { CapabilityResolver } from "./capability-resolver";
import type { RoutingDecision } from "./routing-decision";
import { CapabilityResolverStub } from "./capability-resolver";
import { DefaultAgentSelectionPolicy } from "./default-selection-policy";

/**
 * Input for capability-based routing.
 */
export interface CapabilityRouterInput {
  readonly taskId: string;
  readonly intent: TaskIntent;
}

/**
 * Routes tasks to agents using registry capability metadata (Phase 12).
 */
export interface CapabilityRouter {
  readonly componentId: "capability-router";

  route(
    input: CapabilityRouterInput,
    agentRegistry: AgentRegistry,
  ): Promise<RoutingDecision>;
}

const FALLBACK_AGENT_ID = "hermes";

/**
 * Stub router — deterministic mock decisions, registry metadata only.
 */
export class CapabilityRouterStub implements CapabilityRouter {
  readonly componentId = "capability-router" as const;

  constructor(
    private readonly resolver: CapabilityResolver = new CapabilityResolverStub(),
    private readonly policy: AgentSelectionPolicy = new DefaultAgentSelectionPolicy(),
  ) {}

  async route(
    input: CapabilityRouterInput,
    agentRegistry: AgentRegistry,
  ): Promise<RoutingDecision> {
    const agents = await agentRegistry.list();
    const matches = await this.resolver.resolve({
      taskId: input.taskId,
      intent: input.intent,
      agents,
    });

    const selected = this.policy.select(matches, input.intent);
    const selectedAgentId = selected?.agentId ?? FALLBACK_AGENT_ID;

    return {
      taskId: input.taskId,
      selectedAgentId,
      policyId: this.policy.policyId,
      reason: selected
        ? `Selected ${selected.agentId} (score=${selected.score}, stub)`
        : `Fallback to ${FALLBACK_AGENT_ID} — no capability match`,
      matches,
    };
  }
}
