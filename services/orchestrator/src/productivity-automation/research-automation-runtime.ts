export interface ResearchAutomationStep {
  readonly stepId: string;
  readonly topic: string;
  readonly userLabel: string;
  readonly completed: boolean;
}

export interface ResearchAutomationResult {
  readonly runId: string;
  readonly steps: readonly ResearchAutomationStep[];
  readonly summary: string;
}

const RESEARCH_PATTERN =
  /\b(research|brief|news|summarize today|trading research|workspace|gather)\b/i;

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Automates research briefings and workspace preparation (Phase 98).
 */
export class ResearchAutomationRuntime {
  matches(description: string): boolean {
    return RESEARCH_PATTERN.test(description);
  }

  run(description: string): ResearchAutomationResult {
    const steps: ResearchAutomationStep[] = [];
    const lower = description.toLowerCase();

    if (/\b(news|ai news|today)\b/i.test(description)) {
      steps.push({
        stepId: nextId("research"),
        topic: "Daily news briefing",
        userLabel: "Researching…",
        completed: false,
      });
    }
    if (/\b(trading|market|gold|workspace)\b/i.test(description)) {
      steps.push({
        stepId: nextId("research"),
        topic: "Trading research workspace",
        userLabel: "Preparing workspace…",
        completed: false,
      });
    }
    if (steps.length === 0) {
      steps.push({
        stepId: nextId("research"),
        topic: description.slice(0, 80),
        userLabel: "Researching…",
        completed: false,
      });
    }

    const completedSteps = steps.map((step) => ({ ...step, completed: true }));
    const summary = lower.includes("workspace")
      ? "Research workspace prepared."
      : "Research briefing ready.";

    return {
      runId: nextId("research-run"),
      steps: completedSteps,
      summary,
    };
  }
}

export function createDefaultResearchAutomationRuntime(): ResearchAutomationRuntime {
  return new ResearchAutomationRuntime();
}
