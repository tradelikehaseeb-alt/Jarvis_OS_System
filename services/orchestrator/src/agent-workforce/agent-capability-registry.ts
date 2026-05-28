export type WorkforceWorkerType =
  | "research"
  | "browser"
  | "coding"
  | "market"
  | "scheduling"
  | "document"
  | "communication";

export interface WorkforceWorkerCapability {
  readonly workerType: WorkforceWorkerType;
  readonly capabilityTokens: readonly string[];
  readonly userLabel: string;
  readonly priority: number;
}

const WORKER_CAPABILITIES: readonly WorkforceWorkerCapability[] = [
  {
    workerType: "research",
    capabilityTokens: ["research", "reasoning", "planning"],
    userLabel: "Researching…",
    priority: 80,
  },
  {
    workerType: "browser",
    capabilityTokens: ["browser-automation", "execution"],
    userLabel: "Performing task…",
    priority: 70,
  },
  {
    workerType: "coding",
    capabilityTokens: ["coding", "execution", "reasoning"],
    userLabel: "Working…",
    priority: 65,
  },
  {
    workerType: "market",
    capabilityTokens: ["market-analysis", "research", "reasoning"],
    userLabel: "Analyzing…",
    priority: 75,
  },
  {
    workerType: "scheduling",
    capabilityTokens: ["scheduling", "planning"],
    userLabel: "Scheduling…",
    priority: 60,
  },
  {
    workerType: "document",
    capabilityTokens: ["document", "draft", "planning"],
    userLabel: "Preparing summary…",
    priority: 68,
  },
  {
    workerType: "communication",
    capabilityTokens: ["communication", "draft"],
    userLabel: "Sending…",
    priority: 55,
  },
] as const;

/**
 * Registry of specialized workforce worker capabilities (Phase 97).
 */
export class AgentCapabilityRegistry {
  list(): readonly WorkforceWorkerCapability[] {
    return WORKER_CAPABILITIES;
  }

  get(workerType: WorkforceWorkerType): WorkforceWorkerCapability | undefined {
    return WORKER_CAPABILITIES.find((entry) => entry.workerType === workerType);
  }

  resolveForTokens(tokens: readonly string[]): WorkforceWorkerCapability | undefined {
    const normalized = tokens.map((token) => token.toLowerCase());
    const sorted = [...WORKER_CAPABILITIES].sort((a, b) => b.priority - a.priority);
    return sorted.find((entry) =>
      entry.capabilityTokens.some((token) => normalized.includes(token)),
    );
  }
}

export function createDefaultAgentCapabilityRegistry(): AgentCapabilityRegistry {
  return new AgentCapabilityRegistry();
}
