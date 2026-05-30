import {
  createDefaultAgentCapabilityRegistry,
  type AgentCapabilityRegistry,
} from "./agent-capability-registry";
import {
  createDefaultParallelExecutionCoordinator,
  type ParallelExecutionCoordinator,
  type ParallelWorkerExecutor,
} from "./parallel-execution-coordinator";
import {
  createDefaultPersistentAgentSession,
  type PersistentAgentSession,
} from "./persistent-agent-session";
import {
  createDefaultTaskDelegationEngine,
  shouldCoordinateWorkforce,
  type TaskDelegationEngine,
  type TaskDelegationPlan,
} from "./task-delegation-engine";
import {
  createDefaultLongRunningTaskRuntime,
  type LongRunningTaskRuntime,
} from "./long-running-task-runtime";
import {
  createDefaultWorkflowSupervisorRuntime,
  type WorkflowSupervisorRuntime,
} from "./workflow-supervisor-runtime";

export interface WorkforceActivityEvent {
  readonly workerType: string;
  readonly userLabel: string;
  readonly message: string;
  readonly completed: boolean;
  readonly timestamp: string;
}

export interface WorkforceCoordinationResult {
  readonly plan: TaskDelegationPlan;
  readonly sessionId: string;
  readonly success: boolean;
  readonly stub: boolean;
  readonly summary: string;
  readonly activities: readonly WorkforceActivityEvent[];
  readonly longRunningTaskId?: string;
}

export interface WorkforceCoordinationInput {
  readonly description: string;
  readonly intentKind: string;
  readonly userId: string;
  readonly conversationId?: string;
  readonly sharedContextRef?: string;
  readonly executor?: ParallelWorkerExecutor;
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Coordinates specialized AI workers with delegation, parallelism, and supervision (Phase 97).
 */
export class AgentWorkforceRuntime {
  constructor(
    private readonly registry: AgentCapabilityRegistry = createDefaultAgentCapabilityRegistry(),
    private readonly delegationEngine: TaskDelegationEngine = createDefaultTaskDelegationEngine(),
    private readonly parallelCoordinator: ParallelExecutionCoordinator = createDefaultParallelExecutionCoordinator(),
    private readonly sessionStore: PersistentAgentSession = createDefaultPersistentAgentSession(),
    private readonly supervisor: WorkflowSupervisorRuntime = createDefaultWorkflowSupervisorRuntime(),
    private readonly longRunningTasks: LongRunningTaskRuntime = createDefaultLongRunningTaskRuntime(),
  ) {}

  shouldCoordinate(description: string, intentKind: string): boolean {
    return shouldCoordinateWorkforce(description, intentKind);
  }

  async coordinate(input: WorkforceCoordinationInput): Promise<WorkforceCoordinationResult> {
    this.supervisor.reset();
    const plan = this.delegationEngine.buildPlan(input.description);
    const session = this.sessionStore.create({
      userId: input.userId,
      conversationId: input.conversationId,
      workerTypes: plan.items.map((item) => item.workerType),
      sharedContextRef: input.sharedContextRef,
    });

    const longTask = this.longRunningTasks.enqueue(input.description);
    this.longRunningTasks.start(longTask.taskId);

    const executor: ParallelWorkerExecutor =
      input.executor ??
      {
        async execute(item) {
          return {
            success: true,
            stub: true,
            message: `${item.userLabel.replace("…", "")} complete`,
          };
        },
      };

    const activities: WorkforceActivityEvent[] = [];
    let stepIndex = 0;

    for (const item of plan.items) {
      stepIndex += 1;
      const decision = this.supervisor.beforeStep(stepIndex, item.workerType);
      if (!decision.allowed) {
        activities.push({
          workerType: item.workerType,
          userLabel: item.userLabel,
          message: decision.message,
          completed: false,
          timestamp: nowIso(),
        });
        break;
      }
      this.sessionStore.touchProgress(session.sessionId);
    }

    const execution = plan.parallel
      ? await this.parallelCoordinator.executeParallel(plan.items, executor)
      : await this.parallelCoordinator.executeSequential(plan.items, executor);

    for (const result of execution.results) {
      const capability = this.registry.get(result.workerType);
      activities.push({
        workerType: result.workerType,
        userLabel: capability?.userLabel ?? "Working…",
        message: result.message,
        completed: result.success,
        timestamp: nowIso(),
      });
      this.longRunningTasks.updateProgress(
        longTask.taskId,
        activities.filter((entry) => entry.completed).length / Math.max(plan.items.length, 1),
      );
    }

    const success = execution.success;
    this.sessionStore.complete(session.sessionId, success);
    this.longRunningTasks.complete(longTask.taskId, success);
    this.parallelCoordinator.cleanupInactiveWorkers();

    return {
      plan,
      sessionId: session.sessionId,
      success,
      stub: execution.results.every((entry) => entry.stub),
      summary: this.supervisor.summarize(plan, execution.results),
      activities,
      longRunningTaskId: longTask.taskId,
    };
  }

  cancelActiveWorkflow(): void {
    this.supervisor.cancel();
  }

  listActiveSessions(): ReturnType<PersistentAgentSession["listActive"]> {
    return this.sessionStore.listActive();
  }
}

export function createDefaultAgentWorkforceRuntime(): AgentWorkforceRuntime {
  return new AgentWorkforceRuntime();
}
