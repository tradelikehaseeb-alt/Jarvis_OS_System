export type ProactiveWorkflowKind =
  | "monitor"
  | "watch"
  | "remind"
  | "background"
  | "scheduled-briefing";

export interface ProactiveWorkflowItem {
  readonly workflowId: string;
  readonly kind: ProactiveWorkflowKind;
  readonly description: string;
  readonly userLabel: string;
  readonly background: boolean;
}

export interface ProactiveWorkflowPlan {
  readonly planId: string;
  readonly items: readonly ProactiveWorkflowItem[];
  readonly continuous: boolean;
}

const CONTINUOUS_PATTERN =
  /\b(monitor|watch|alert|remind|background|continue|every morning|daily briefing|keep watching|when this task completes)\b/i;

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Builds proactive and background workflow plans (Phase 99).
 */
export class ProactiveWorkflowEngine {
  matches(description: string): boolean {
    return CONTINUOUS_PATTERN.test(description);
  }

  buildPlan(description: string): ProactiveWorkflowPlan {
    const items: ProactiveWorkflowItem[] = [];

    if (/\b(monitor|alert)\b/i.test(description)) {
      items.push({
        workflowId: nextId("proactive"),
        kind: "monitor",
        description,
        userLabel: "Monitoring…",
        background: true,
      });
    }
    if (/\b(watch|keep watching|news|updates)\b/i.test(description)) {
      items.push({
        workflowId: nextId("proactive"),
        kind: "watch",
        description,
        userLabel: "Watching for updates…",
        background: true,
      });
    }
    if (/\b(remind|when this task completes|alert me)\b/i.test(description)) {
      items.push({
        workflowId: nextId("proactive"),
        kind: "remind",
        description,
        userLabel: "Reminder set…",
        background: true,
      });
    }
    if (/\b(background|continue this workflow)\b/i.test(description)) {
      items.push({
        workflowId: nextId("proactive"),
        kind: "background",
        description,
        userLabel: "Running in background…",
        background: true,
      });
    }
    if (/\b(every morning|daily briefing|prepare my daily)\b/i.test(description)) {
      items.push({
        workflowId: nextId("proactive"),
        kind: "scheduled-briefing",
        description,
        userLabel: "Preparing briefing…",
        background: false,
      });
    }

    if (items.length === 0) {
      items.push({
        workflowId: nextId("proactive"),
        kind: "background",
        description,
        userLabel: "Running in background…",
        background: true,
      });
    }

    return {
      planId: nextId("proactive-plan"),
      items,
      continuous: items.some((item) => item.background),
    };
  }
}

export function createDefaultProactiveWorkflowEngine(): ProactiveWorkflowEngine {
  return new ProactiveWorkflowEngine();
}

export function shouldActivateContinuousRuntime(description: string): boolean {
  return CONTINUOUS_PATTERN.test(description);
}
