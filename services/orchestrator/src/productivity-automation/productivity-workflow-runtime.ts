import {
  createDefaultWorkflowSupervisorRuntime,
  type WorkflowSupervisorRuntime,
} from "../agent-workforce/workflow-supervisor-runtime";
import {
  CommunicationAutomationRuntime,
  createDefaultCommunicationAutomationRuntime,
  type CommunicationAutomationResult,
} from "./communication-automation-runtime";
import {
  DailyAssistantRuntime,
  createDefaultDailyAssistantRuntime,
  type ProactiveSuggestion,
} from "./daily-assistant-runtime";
import {
  PersonalContextRuntime,
  createDefaultPersonalContextRuntime,
  type PersonalContextSnapshot,
} from "./personal-context-runtime";
import {
  ResearchAutomationRuntime,
  createDefaultResearchAutomationRuntime,
  type ResearchAutomationResult,
} from "./research-automation-runtime";
import {
  SmartSchedulingRuntime,
  createDefaultSmartSchedulingRuntime,
  type SmartSchedulingResult,
} from "./smart-scheduling-runtime";
import {
  TaskPlanningRuntime,
  createDefaultTaskPlanningRuntime,
  type TaskPlanningResult,
} from "./task-planning-runtime";

export interface ProductivityActivityEvent {
  readonly kind: string;
  readonly userLabel: string;
  readonly message: string;
  readonly completed: boolean;
  readonly timestamp: string;
}

export interface ProductivityWorkflowResult {
  readonly sessionId: string;
  readonly success: boolean;
  readonly stub: boolean;
  readonly summary: string;
  readonly activities: readonly ProductivityActivityEvent[];
  readonly suggestions: readonly ProactiveSuggestion[];
  readonly taskPlan?: TaskPlanningResult;
  readonly personalContext?: PersonalContextSnapshot;
  readonly research?: ResearchAutomationResult;
  readonly communication?: CommunicationAutomationResult;
  readonly scheduling?: SmartSchedulingResult;
}

export interface ProductivityWorkflowInput {
  readonly description: string;
  readonly intentKind: string;
  readonly userId: string;
  readonly conversationId?: string;
}

const REMEMBER_PATTERN = /\bremember\b/i;

const PRODUCTIVITY_PATTERN =
  /\b(email|inbox|unread|organize|priorit|tasks? for today|schedule|calendar|meeting|remember|brief|research|workspace|trading|summarize|my day|meeting summary)\b/i;

function nowIso(): string {
  return new Date().toISOString();
}

export function shouldActivateProductivity(description: string, intentKind: string): boolean {
  if (intentKind === "plan" || intentKind === "research" || intentKind === "automate") {
    return PRODUCTIVITY_PATTERN.test(description);
  }
  return PRODUCTIVITY_PATTERN.test(description);
}

/**
 * Coordinates daily productivity workflows across specialized runtimes (Phase 98).
 */
export class ProductivityWorkflowRuntime {
  constructor(
    private readonly personalContext: PersonalContextRuntime = createDefaultPersonalContextRuntime(),
    private readonly taskPlanning: TaskPlanningRuntime = createDefaultTaskPlanningRuntime(),
    private readonly scheduling: SmartSchedulingRuntime = createDefaultSmartSchedulingRuntime(),
    private readonly research: ResearchAutomationRuntime = createDefaultResearchAutomationRuntime(),
    private readonly communication: CommunicationAutomationRuntime = createDefaultCommunicationAutomationRuntime(),
    private readonly dailyAssistant: DailyAssistantRuntime = createDefaultDailyAssistantRuntime(),
    private readonly supervisor: WorkflowSupervisorRuntime = createDefaultWorkflowSupervisorRuntime(),
  ) {}

  shouldActivate(description: string, intentKind: string): boolean {
    return shouldActivateProductivity(description, intentKind);
  }

  async run(input: ProductivityWorkflowInput): Promise<ProductivityWorkflowResult> {
    this.supervisor.reset();
    const session = this.dailyAssistant.startSession(input.userId);
    const activities: ProductivityActivityEvent[] = [];
    let stepIndex = 0;

    let personalContext = this.personalContext.getOrCreate(
      input.userId,
      input.conversationId,
    );

    if (REMEMBER_PATTERN.test(input.description)) {
      personalContext = this.personalContext.rememberProjectDirection(
        input.userId,
        input.description.replace(/remember\s+(this\s+)?/i, "").trim(),
        input.conversationId,
      );
      activities.push({
        kind: "memory",
        userLabel: "Saving preference…",
        message: "Project direction remembered",
        completed: true,
        timestamp: nowIso(),
      });
    }

    let taskPlan: TaskPlanningResult | undefined;
    const plan = this.taskPlanning.buildPlan(input.description);
    if (plan) {
      stepIndex += 1;
      const decision = this.supervisor.beforeStep(stepIndex, "task-planning");
      if (decision.allowed) {
        taskPlan = plan;
        for (const task of plan.tasks) {
          activities.push({
            kind: "task-planning",
            userLabel: task.userLabel,
            message: task.title,
            completed: true,
            timestamp: nowIso(),
          });
        }
      }
    }

    let communication: CommunicationAutomationResult | undefined;
    if (this.communication.matches(input.description)) {
      stepIndex += 1;
      const decision = this.supervisor.beforeStep(stepIndex, "communication");
      if (decision.allowed) {
        communication = this.communication.run(input.description);
        for (const step of communication.steps) {
          activities.push({
            kind: "communication",
            userLabel: step.userLabel,
            message: step.message,
            completed: step.completed,
            timestamp: nowIso(),
          });
        }
      }
    }

    let researchResult: ResearchAutomationResult | undefined;
    if (this.research.matches(input.description)) {
      stepIndex += 1;
      const decision = this.supervisor.beforeStep(stepIndex, "research");
      if (decision.allowed) {
        researchResult = this.research.run(input.description);
        for (const step of researchResult.steps) {
          activities.push({
            kind: "research",
            userLabel: step.userLabel,
            message: step.topic,
            completed: step.completed,
            timestamp: nowIso(),
          });
        }
      }
    }

    let scheduling: SmartSchedulingResult | undefined;
    if (this.scheduling.matches(input.description)) {
      stepIndex += 1;
      const decision = this.supervisor.beforeStep(stepIndex, "scheduling");
      if (decision.allowed) {
        scheduling = this.scheduling.buildActions(input.description);
        for (const action of scheduling.actions) {
          activities.push({
            kind: "scheduling",
            userLabel: action.userLabel,
            message: action.message,
            completed: true,
            timestamp: nowIso(),
          });
        }
      }
    }

    if (activities.length === 0) {
      activities.push({
        kind: "assistant",
        userLabel: "Working…",
        message: "Processing your request",
        completed: true,
        timestamp: nowIso(),
      });
    }

    this.dailyAssistant.touch(session.sessionId);
    const suggestions = this.dailyAssistant.buildSuggestions(input.description);
    const summary = this.buildSummary(taskPlan, communication, researchResult, scheduling);

    return {
      sessionId: session.sessionId,
      success: true,
      stub: true,
      summary,
      activities,
      suggestions,
      taskPlan,
      personalContext,
      research: researchResult,
      communication,
      scheduling,
    };
  }

  cancelActive(): void {
    this.supervisor.cancel();
  }

  private buildSummary(
    taskPlan?: TaskPlanningResult,
    communication?: CommunicationAutomationResult,
    research?: ResearchAutomationResult,
    scheduling?: SmartSchedulingResult,
  ): string {
    const parts: string[] = [];
    if (communication) {
      parts.push(communication.summary);
    }
    if (research) {
      parts.push(research.summary);
    }
    if (taskPlan) {
      parts.push(taskPlan.summary);
    }
    if (scheduling) {
      parts.push(scheduling.summary);
    }
    if (parts.length === 0) {
      return "Completed.";
    }
    return parts.join(" ");
  }
}

export function createDefaultProductivityWorkflowRuntime(): ProductivityWorkflowRuntime {
  return new ProductivityWorkflowRuntime();
}
