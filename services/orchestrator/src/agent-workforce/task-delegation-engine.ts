import type { WorkforceWorkerType } from "./agent-capability-registry";
import {
  AgentCapabilityRegistry,
  createDefaultAgentCapabilityRegistry,
} from "./agent-capability-registry";

export interface DelegatedWorkItem {
  readonly delegationId: string;
  readonly workerType: WorkforceWorkerType;
  readonly action: string;
  readonly userLabel: string;
  readonly priority: number;
}

export interface TaskDelegationPlan {
  readonly planId: string;
  readonly description: string;
  readonly items: readonly DelegatedWorkItem[];
  readonly parallel: boolean;
}

const RESEARCH_PATTERN = /\b(research|gather|find|search)\b/i;
const MARKET_PATTERN = /\b(market|trading|gold|impact|analyze|analysis)\b/i;
const DOCUMENT_PATTERN = /\b(prepare|brief|summary|summarize|document|report)\b/i;
const BROWSER_PATTERN = /\b(open|browse|navigate|website)\b/i;
const SCHEDULE_PATTERN = /\b(schedule|calendar|meeting|remind)\b/i;
const COMMUNICATION_PATTERN = /\b(email|send|message|notify|communicate)\b/i;
const CODING_PATTERN = /\b(code|implement|build|fix|debug)\b/i;

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function buildItem(
  registry: AgentCapabilityRegistry,
  workerType: WorkforceWorkerType,
  action: string,
): DelegatedWorkItem | undefined {
  const capability = registry.get(workerType);
  if (!capability) {
    return undefined;
  }
  return {
    delegationId: nextId("delegation"),
    workerType,
    action,
    userLabel: capability.userLabel,
    priority: capability.priority,
  };
}

/**
 * Builds multi-agent delegation plans from natural language (Phase 97).
 */
export class TaskDelegationEngine {
  constructor(
    private readonly registry: AgentCapabilityRegistry = createDefaultAgentCapabilityRegistry(),
  ) {}

  buildPlan(description: string): TaskDelegationPlan {
    const items: DelegatedWorkItem[] = [];
    const lower = description.toLowerCase();

    if (RESEARCH_PATTERN.test(description)) {
      const item = buildItem(this.registry, "research", "Gather relevant information");
      if (item) items.push(item);
    }
    if (MARKET_PATTERN.test(description)) {
      const item = buildItem(this.registry, "market", "Analyze market impact");
      if (item) items.push(item);
    }
    if (DOCUMENT_PATTERN.test(description)) {
      const item = buildItem(this.registry, "document", "Prepare coordinated summary");
      if (item) items.push(item);
    }
    if (BROWSER_PATTERN.test(description)) {
      const item = buildItem(this.registry, "browser", "Execute browser workflow");
      if (item) items.push(item);
    }
    if (SCHEDULE_PATTERN.test(description)) {
      const item = buildItem(this.registry, "scheduling", "Update schedule");
      if (item) items.push(item);
    }
    if (COMMUNICATION_PATTERN.test(description)) {
      const item = buildItem(this.registry, "communication", "Draft communication");
      if (item) items.push(item);
    }
    if (CODING_PATTERN.test(description)) {
      const item = buildItem(this.registry, "coding", "Implement requested changes");
      if (item) items.push(item);
    }

    if (items.length === 0) {
      const fallback = buildItem(this.registry, "research", description);
      if (fallback) {
        items.push(fallback);
      }
    }

    const deduped = [...new Map(items.map((item) => [item.workerType, item])).values()].sort(
      (a, b) => b.priority - a.priority,
    );

    return {
      planId: nextId("workforce-plan"),
      description,
      items: deduped,
      parallel: deduped.length > 1 && !SCHEDULE_PATTERN.test(lower),
    };
  }
}

export function createDefaultTaskDelegationEngine(): TaskDelegationEngine {
  return new TaskDelegationEngine();
}

export function shouldCoordinateWorkforce(description: string, intentKind: string): boolean {
  if (intentKind === "research") {
    return true;
  }
  const clauses = description.split(/,|\band\b/i).filter((part) => part.trim().length > 0);
  return clauses.length >= 2 && /\b(research|analyze|prepare|summarize|market)\b/i.test(description);
}
