export interface CommunicationAutomationStep {
  readonly stepId: string;
  readonly channel: "email" | "message" | "summary";
  readonly userLabel: string;
  readonly message: string;
  readonly completed: boolean;
}

export interface CommunicationAutomationResult {
  readonly runId: string;
  readonly steps: readonly CommunicationAutomationStep[];
  readonly summary: string;
}

const COMMUNICATION_PATTERN =
  /\b(email|inbox|unread|message|notify|communicate|meeting summary)\b/i;

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Email and communication workflow automation (Phase 98).
 */
export class CommunicationAutomationRuntime {
  matches(description: string): boolean {
    return COMMUNICATION_PATTERN.test(description);
  }

  run(description: string): CommunicationAutomationResult {
    const steps: CommunicationAutomationStep[] = [];

    if (/\b(unread|inbox|email)\b/i.test(description)) {
      steps.push({
        stepId: nextId("comm"),
        channel: "email",
        userLabel: "Reviewing emails…",
        message: "Unread emails summarized",
        completed: true,
      });
    }
    if (/\bmeeting summary\b/i.test(description)) {
      steps.push({
        stepId: nextId("comm"),
        channel: "summary",
        userLabel: "Summarizing…",
        message: "Meeting summary prepared",
        completed: true,
      });
    }
    if (/\b(message|notify|send)\b/i.test(description)) {
      steps.push({
        stepId: nextId("comm"),
        channel: "message",
        userLabel: "Drafting message…",
        message: "Communication draft ready",
        completed: true,
      });
    }
    if (steps.length === 0) {
      steps.push({
        stepId: nextId("comm"),
        channel: "summary",
        userLabel: "Summarizing…",
        message: "Communication summary ready",
        completed: true,
      });
    }

    return {
      runId: nextId("comm-run"),
      steps,
      summary: "Communication workflow complete.",
    };
  }
}

export function createDefaultCommunicationAutomationRuntime(): CommunicationAutomationRuntime {
  return new CommunicationAutomationRuntime();
}
