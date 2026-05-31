import type { TaskIntent, UserTask, WorkflowStep } from "@jarvis/types";

import { HERMES_AGENT_ID, OPENCLAW_AGENT_ID } from "../execution/agent-ids";

/** Routed intent kinds used for workflow and capability selection. */
export type RoutedIntentKind =
  | "chat"
  | "research"
  | "automate"
  | "browse"
  | "file"
  | "cron"
  | "plan"
  | "draft";

const SEARCH_PATTERN =
  /\b(search|find|research|look\s*up|investigate|discover)\b/i;
const BROWSE_PATTERN =
  /\b(open|click|browse|navigate|go\s+to|visit|scrape|screenshot)\b/i;
const CRON_PATTERN =
  /\b(remind|schedule|cron|every\s+day|every\s+week|recurring)\b/i;
const FILE_PATTERN =
  /\b(create|read|write|save|list|find|search|delete)\b.*\b(file|files|folder|directory|dir)\b/i;

/**
 * Detect orchestrator routing kind from explicit intent + natural-language description.
 */
export function detectRoutedIntentKind(intent: TaskIntent): RoutedIntentKind {
  const description = intent.description.trim();
  const explicit = intent.kind.trim().toLowerCase();

  if (FILE_PATTERN.test(description)) {
    return "file";
  }
  if (CRON_PATTERN.test(description)) {
    return "cron";
  }
  if (SEARCH_PATTERN.test(description)) {
    return "research";
  }
  if (BROWSE_PATTERN.test(description)) {
    return "browse";
  }

  if (
    explicit === "chat" ||
    explicit === "research" ||
    explicit === "automate" ||
    explicit === "browse" ||
    explicit === "cron" ||
    explicit === "plan" ||
    explicit === "draft"
  ) {
    return explicit as RoutedIntentKind;
  }

  if (explicit === "automate") {
    return "automate";
  }
  if (explicit === "research") {
    return "research";
  }
  if (explicit === "plan") {
    return "plan";
  }
  if (explicit === "draft") {
    return "draft";
  }

  return "chat";
}

function workflowIdForTask(taskId: string): string {
  return `wf-${taskId}`;
}

/**
 * Build ordered workflow steps for a routed intent (real agents — no stub labels).
 */
export function buildWorkflowStepsForTask(task: UserTask): readonly WorkflowStep[] {
  const routed = detectRoutedIntentKind(task.intent);

  switch (routed) {
    case "research":
      return [
        {
          stepId: "research-plan",
          order: 0,
          name: "Plan research",
          agentId: HERMES_AGENT_ID,
          dependsOn: [],
        },
        {
          stepId: "research-search",
          order: 1,
          name: "Run search skill",
          agentId: HERMES_AGENT_ID,
          skillId: "search-skill",
          dependsOn: ["research-plan"],
        },
      ];
    case "file":
      return [
        {
          stepId: "file-plan",
          order: 0,
          name: "Plan file operation",
          agentId: HERMES_AGENT_ID,
          dependsOn: [],
        },
        {
          stepId: "file-execute",
          order: 1,
          name: "Execute file skill",
          agentId: OPENCLAW_AGENT_ID,
          skillId: "file-skill",
          dependsOn: ["file-plan"],
        },
      ];
    case "automate":
    case "browse":
      return [
        {
          stepId: "automate-plan",
          order: 0,
          name: "Plan automation",
          agentId: HERMES_AGENT_ID,
          dependsOn: [],
        },
        {
          stepId: "automate-execute",
          order: 1,
          name: "Execute via OpenClaw",
          agentId: OPENCLAW_AGENT_ID,
          dependsOn: ["automate-plan"],
        },
      ];
    case "cron":
      return [
        {
          stepId: "cron-plan",
          order: 0,
          name: "Plan scheduled task",
          agentId: HERMES_AGENT_ID,
          dependsOn: [],
        },
      ];
    case "plan":
    case "draft":
      return [
        {
          stepId: "plan-step",
          order: 0,
          name: "Plan task",
          agentId: HERMES_AGENT_ID,
          dependsOn: [],
        },
      ];
    case "chat":
    default:
      return [
        {
          stepId: "chat-respond",
          order: 0,
          name: "Conversational response",
          agentId: HERMES_AGENT_ID,
          dependsOn: [],
        },
      ];
  }
}

export function buildWorkflowRouteMeta(task: UserTask): {
  readonly workflowId: string;
  readonly routedKind: RoutedIntentKind;
  readonly steps: readonly WorkflowStep[];
} {
  return {
    workflowId: workflowIdForTask(task.id),
    routedKind: detectRoutedIntentKind(task.intent),
    steps: buildWorkflowStepsForTask(task),
  };
}
