import type { AgentRegistry } from "../agent-registry/contract";
import { HERMES_AGENT_ID, OPENCLAW_AGENT_ID } from "../execution/agent-ids";
import { detectRoutedIntentKind } from "../internal/intent-routing";
import type { AgentCapabilityMatch } from "./agent-capability-match";
import type { AgentSelectionPolicy } from "./agent-selection-policy";
import type { CapabilityResolver } from "./capability-resolver";
import { CapabilityResolverStub } from "./capability-resolver";
import type { CapabilityRouter, CapabilityRouterInput } from "./capability-router";
import { DefaultAgentSelectionPolicy } from "./default-selection-policy";
import type { RoutingDecision } from "./routing-decision";

/**
 * Capability router — chat/research → Hermes, automate/browse → OpenClaw when capable.
 */
export class DefaultCapabilityRouter implements CapabilityRouter {
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
    const routedKind = detectRoutedIntentKind(input.intent);

    if (routedKind === "automate" || routedKind === "browse") {
      const openClaw = agents.find((agent) => agent.agentId === OPENCLAW_AGENT_ID);
      if (openClaw?.executionCapable) {
        const match: AgentCapabilityMatch = {
          agentId: openClaw.agentId,
          displayName: openClaw.displayName,
          matchedCapabilities: openClaw.capabilities,
          score: 1,
          executionCapable: true,
        };
        return {
          taskId: input.taskId,
          selectedAgentId: OPENCLAW_AGENT_ID,
          policyId: "intent-routing-v1",
          reason: `Routed ${routedKind} intent to OpenClaw (execution)`,
          matches: [match],
        };
      }
    }

    if (
      routedKind === "chat" ||
      routedKind === "research" ||
      routedKind === "cron" ||
      routedKind === "plan" ||
      routedKind === "draft"
    ) {
      const hermes = agents.find((agent) => agent.agentId === HERMES_AGENT_ID);
      if (hermes) {
        const match: AgentCapabilityMatch = {
          agentId: hermes.agentId,
          displayName: hermes.displayName,
          matchedCapabilities: hermes.capabilities,
          score: 1,
          executionCapable: hermes.executionCapable,
        };
        return {
          taskId: input.taskId,
          selectedAgentId: HERMES_AGENT_ID,
          policyId: "intent-routing-v1",
          reason: `Routed ${routedKind} intent to Hermes`,
          matches: [match],
        };
      }
    }

    const matches = await this.resolver.resolve({
      taskId: input.taskId,
      intent: input.intent,
      agents,
    });

    const selected = this.policy.select(matches, input.intent);
    const selectedAgentId = selected?.agentId ?? HERMES_AGENT_ID;

    return {
      taskId: input.taskId,
      selectedAgentId,
      policyId: this.policy.policyId,
      reason: selected
        ? `Selected ${selected.agentId} (score=${selected.score})`
        : `Fallback to ${HERMES_AGENT_ID} — no capability match`,
      matches,
    };
  }
}
