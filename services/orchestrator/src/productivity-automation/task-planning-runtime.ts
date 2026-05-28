export type ProductivityTaskPriority = "high" | "medium" | "low";

export interface PlannedProductivityTask {
  readonly taskId: string;
  readonly title: string;
  readonly priority: ProductivityTaskPriority;
  readonly userLabel: string;
}

export interface TaskPlanningResult {
  readonly planId: string;
  readonly tasks: readonly PlannedProductivityTask[];
  readonly summary: string;
}

const ORGANIZE_PATTERN = /\b(organize|priorit|tasks? for today|my day|to-?do)\b/i;
const PRIORITY_PATTERN = /\b(priorit|urgent|important|focus)\b/i;

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function inferPriority(description: string): ProductivityTaskPriority {
  if (/\b(urgent|asap|critical)\b/i.test(description)) {
    return "high";
  }
  if (PRIORITY_PATTERN.test(description)) {
    return "high";
  }
  return "medium";
}

/**
 * Organizes daily tasks and priorities from natural language (Phase 98).
 */
export class TaskPlanningRuntime {
  buildPlan(description: string): TaskPlanningResult | undefined {
    if (!ORGANIZE_PATTERN.test(description) && !PRIORITY_PATTERN.test(description)) {
      return undefined;
    }

    const tasks: PlannedProductivityTask[] = [];
    const priority = inferPriority(description);

    if (/\b(email|inbox|unread)\b/i.test(description)) {
      tasks.push({
        taskId: nextId("task"),
        title: "Review and summarize emails",
        priority,
        userLabel: "Reviewing emails…",
      });
    }
    if (/\b(research|brief|news)\b/i.test(description)) {
      tasks.push({
        taskId: nextId("task"),
        title: "Research and brief",
        priority,
        userLabel: "Researching…",
      });
    }
    if (/\b(meeting|calendar|schedule)\b/i.test(description)) {
      tasks.push({
        taskId: nextId("task"),
        title: "Review schedule and meetings",
        priority: "medium",
        userLabel: "Scheduling…",
      });
    }
    if (tasks.length === 0) {
      tasks.push({
        taskId: nextId("task"),
        title: "Organize daily priorities",
        priority,
        userLabel: "Organizing priorities…",
      });
    }

    return {
      planId: nextId("daily-plan"),
      tasks,
      summary: `Organized ${tasks.length} priority task${tasks.length === 1 ? "" : "s"} for today.`,
    };
  }
}

export function createDefaultTaskPlanningRuntime(): TaskPlanningRuntime {
  return new TaskPlanningRuntime();
}
