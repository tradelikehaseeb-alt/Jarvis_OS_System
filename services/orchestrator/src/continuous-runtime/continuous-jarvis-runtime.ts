import {
  BackgroundTaskSupervisor,
  createDefaultBackgroundTaskSupervisor,
} from "./background-task-supervisor";
import {
  ContextAwarenessRuntime,
  createDefaultContextAwarenessRuntime,
} from "./context-awareness-runtime";
import {
  ContinuousExecutionScheduler,
  createDefaultContinuousExecutionScheduler,
} from "./continuous-execution-scheduler";
import {
  PersistentSessionManager,
  createDefaultPersistentSessionManager,
} from "./persistent-session-manager";
import {
  ProactiveWorkflowEngine,
  createDefaultProactiveWorkflowEngine,
  shouldActivateContinuousRuntime,
} from "./proactive-workflow-engine";
import {
  SmartNotificationRuntime,
  createDefaultSmartNotificationRuntime,
  type SmartNotification,
} from "./smart-notification-runtime";

export interface ContinuousActivityEvent {
  readonly kind: string;
  readonly userLabel: string;
  readonly message: string;
  readonly background: boolean;
  readonly completed: boolean;
  readonly timestamp: string;
}

export interface ContinuousRuntimeResult {
  readonly sessionId: string;
  readonly success: boolean;
  readonly stub: boolean;
  readonly summary: string;
  readonly activities: readonly ContinuousActivityEvent[];
  readonly notifications: readonly SmartNotification[];
  readonly backgroundTaskCount: number;
  readonly continuous: boolean;
  readonly presence: "active" | "background" | "idle";
}

export interface ContinuousRuntimeInput {
  readonly description: string;
  readonly intentKind: string;
  readonly userId: string;
  readonly conversationId?: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Main continuous Jarvis runtime — proactive assistance and background workflows (Phase 99).
 */
export class ContinuousJarvisRuntime {
  constructor(
    private readonly sessionManager: PersistentSessionManager = createDefaultPersistentSessionManager(),
    private readonly contextAwareness: ContextAwarenessRuntime = createDefaultContextAwarenessRuntime(),
    private readonly proactiveEngine: ProactiveWorkflowEngine = createDefaultProactiveWorkflowEngine(),
    private readonly backgroundSupervisor: BackgroundTaskSupervisor = createDefaultBackgroundTaskSupervisor(),
    private readonly notifications: SmartNotificationRuntime = createDefaultSmartNotificationRuntime(),
    private readonly scheduler: ContinuousExecutionScheduler = createDefaultContinuousExecutionScheduler(),
  ) {}

  shouldActivate(description: string): boolean {
    return shouldActivateContinuousRuntime(description);
  }

  async run(input: ContinuousRuntimeInput): Promise<ContinuousRuntimeResult> {
    this.backgroundSupervisor.reset();

    const session = this.sessionManager.create(input.userId, input.conversationId);
    const context = this.contextAwareness.evaluate(
      input.description,
      input.userId,
      input.conversationId,
    );
    const plan = this.proactiveEngine.buildPlan(input.description);
    const schedule = this.scheduler.schedule(input.description);

    const activities: ContinuousActivityEvent[] = [];
    const notificationList: SmartNotification[] = [];

    for (const signal of context.signals) {
      activities.push({
        kind: "context",
        userLabel: signal.userLabel,
        message: signal.topic,
        background: true,
        completed: false,
        timestamp: nowIso(),
      });
    }

    for (const item of plan.items) {
      const bgTask = this.backgroundSupervisor.enqueue(item.workflowId, item.userLabel);
      this.backgroundSupervisor.start(bgTask.taskId);

      const stepCheck = this.backgroundSupervisor.beforeStep(bgTask.taskId);
      if (!stepCheck.allowed && stepCheck.recover) {
        this.backgroundSupervisor.recover(bgTask.taskId);
      }

      this.backgroundSupervisor.complete(bgTask.taskId, true);
      this.sessionManager.incrementWorkflows(session.sessionId);

      activities.push({
        kind: item.kind,
        userLabel: item.userLabel,
        message: item.description.slice(0, 120),
        background: item.background,
        completed: true,
        timestamp: nowIso(),
      });

      const notification = this.notifications.buildForWorkflow(item.kind, true);
      if (!notification.throttled) {
        notificationList.push(notification);
      }
    }

    if (schedule.jobs.length > 0) {
      activities.push({
        kind: "schedule",
        userLabel: schedule.jobs[0]?.userLabel ?? "Scheduled…",
        message: `Next: ${schedule.nextRunHint}`,
        background: true,
        completed: true,
        timestamp: nowIso(),
      });
    }

    const presence = plan.continuous ? "background" : "active";
    this.sessionManager.touch(session.sessionId, presence === "background" ? "background" : "active");
    this.backgroundSupervisor.cleanupInactive();

    return {
      sessionId: session.sessionId,
      success: true,
      stub: true,
      summary: this.buildSummary(plan.continuous, notificationList),
      activities,
      notifications: notificationList,
      backgroundTaskCount: plan.items.filter((item) => item.background).length,
      continuous: plan.continuous || context.dailyContinuity,
      presence,
    };
  }

  cancelActive(): void {
    this.backgroundSupervisor.cancel();
  }

  listActiveSessions(): readonly ReturnType<PersistentSessionManager["listActive"]> {
    return this.sessionManager.listActive();
  }

  private buildSummary(continuous: boolean, notifications: readonly SmartNotification[]): string {
    if (notifications.length > 0) {
      return notifications.map((entry) => entry.message).join(" ");
    }
    return continuous ? "Running in background." : "Completed.";
  }
}

export function createDefaultContinuousJarvisRuntime(): ContinuousJarvisRuntime {
  return new ContinuousJarvisRuntime();
}

export { shouldActivateContinuousRuntime };
