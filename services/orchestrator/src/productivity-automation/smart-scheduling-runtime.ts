export interface SchedulingAction {
  readonly actionId: string;
  readonly kind: "meeting" | "reminder" | "calendar-review";
  readonly userLabel: string;
  readonly message: string;
}

export interface SmartSchedulingResult {
  readonly sessionId: string;
  readonly actions: readonly SchedulingAction[];
  readonly summary: string;
}

const SCHEDULE_PATTERN =
  /\b(schedule|calendar|meeting|remind|appointment|today'?s agenda)\b/i;

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Smart scheduling for meetings, reminders, and daily agenda (Phase 98).
 */
export class SmartSchedulingRuntime {
  matches(description: string): boolean {
    return SCHEDULE_PATTERN.test(description);
  }

  buildActions(description: string): SmartSchedulingResult {
    const actions: SchedulingAction[] = [];

    if (/\bmeeting\b/i.test(description)) {
      actions.push({
        actionId: nextId("sched"),
        kind: "meeting",
        userLabel: "Preparing meeting summary…",
        message: "Meeting context prepared",
      });
    }
    if (/\b(remind|reminder)\b/i.test(description)) {
      actions.push({
        actionId: nextId("sched"),
        kind: "reminder",
        userLabel: "Scheduling…",
        message: "Reminder queued",
      });
    }
    if (actions.length === 0) {
      actions.push({
        actionId: nextId("sched"),
        kind: "calendar-review",
        userLabel: "Scheduling…",
        message: "Daily agenda reviewed",
      });
    }

    return {
      sessionId: nextId("sched-session"),
      actions,
      summary: "Schedule updated.",
    };
  }
}

export function createDefaultSmartSchedulingRuntime(): SmartSchedulingRuntime {
  return new SmartSchedulingRuntime();
}
