import type { TaskIntent } from "@jarvis/types";

import type { AgentCapabilityMatch } from "./agent-capability-match";

/**
 * Selects the best {@link AgentCapabilityMatch} from resolver output.
 */
export interface AgentSelectionPolicy {
  readonly policyId: string;

  select(
    matches: readonly AgentCapabilityMatch[],
    intent: TaskIntent,
  ): AgentCapabilityMatch | undefined;
}
