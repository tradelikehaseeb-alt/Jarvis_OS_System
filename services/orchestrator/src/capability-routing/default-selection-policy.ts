import type { TaskIntent } from "@jarvis/types";

import type { AgentCapabilityMatch } from "./agent-capability-match";
import type { AgentSelectionPolicy } from "./agent-selection-policy";
import { requiredCapabilitiesForIntent } from "./intent-capability-profile";

/**
 * Deterministic selection: highest score; tie-break execution for automate intents.
 */
export class DefaultAgentSelectionPolicy implements AgentSelectionPolicy {
  readonly policyId = "default-static-v1" as const;

  select(
    matches: readonly AgentCapabilityMatch[],
    intent: TaskIntent,
  ): AgentCapabilityMatch | undefined {
    if (matches.length === 0) {
      return undefined;
    }

    const required = requiredCapabilitiesForIntent(intent);
    const needsExecution = required.some(
      (c) =>
        c === "execution" ||
        c === "browser-automation" ||
        c === "desktop-automation",
    );

    const sorted = [...matches].sort((a, b) => {
      if (needsExecution && a.executionCapable !== b.executionCapable) {
        return Number(b.executionCapable) - Number(a.executionCapable);
      }
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.agentId.localeCompare(b.agentId);
    });

    return sorted[0];
  }
}
