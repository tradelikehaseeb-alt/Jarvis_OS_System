import type { AgentContext, AgentResult } from "@jarvis/agents-shared";
import {
  createDefaultHermesExecutionBridge,
  type CreateExecutionPlanInput,
  type HermesExecutionBridge,
  type HermesExecutionPlan,
  type HermesOpenClawTaskDescriptor,
  type MapPlanToTasksInput,
} from "@jarvis/hermes";

import type { ExecutionLifecycleManager } from "../execution/execution-lifecycle-manager";
import type { TimelineRuntime } from "../timeline/timeline-runtime";
import { TIMELINE_EVENT_LABELS } from "../timeline/timeline-event";

import {
  TASK_CHAIN_EVENT_LABELS,
  type TaskChainEvent,
  type TaskChainEventKind,
} from "./task-chain-event";
import type {
  OpenClawStepExecutor,
  TaskChainExecuteInput,
  TaskChainExecuteResult,
  TaskChainRuntime,
  TaskChainSubscriber,
} from "./task-chain-runtime";

export interface CreateDefaultTaskChainRuntimeOptions {
  readonly bridge?: HermesExecutionBridge;
  readonly executeOpenClawStep: OpenClawStepExecutor["executeStep"];
  readonly lifecycle?: ExecutionLifecycleManager;
  readonly timelineRuntime?: TimelineRuntime;
}

let eventCounter = 0;

function nextEventId(kind: TaskChainEventKind): string {
  eventCounter += 1;
  return `task-chain-${kind}-${eventCounter}`;
}

class DefaultTaskChainRuntime implements TaskChainRuntime {
  private readonly bridge: HermesExecutionBridge;
  private readonly chains = new Map<string, TaskChainEvent[]>();
  private readonly subscribers = new Map<string, TaskChainSubscriber>();

  constructor(private readonly options: CreateDefaultTaskChainRuntimeOptions) {
    this.bridge = options.bridge ?? createDefaultHermesExecutionBridge();
  }

  createExecutionPlan(input: CreateExecutionPlanInput): HermesExecutionPlan {
    return this.bridge.createExecutionPlan(input);
  }

  mapPlanToTasks(
    input: MapPlanToTasksInput,
  ): readonly HermesOpenClawTaskDescriptor[] {
    return this.bridge.mapPlanToTasks(input);
  }

  async executeTaskChain(
    input: TaskChainExecuteInput,
  ): Promise<TaskChainExecuteResult> {
    const plan = this.createExecutionPlan({
      parentTaskId: input.parentTaskId,
      agentPayload: input.planningResult.payload as
        | Readonly<Record<string, unknown>>
        | undefined,
    });

    const tasks = this.mapPlanToTasks({
      plan,
      parentTaskId: input.parentTaskId,
      userId: input.userId,
      correlationId: input.correlationId,
    });

    if (!input.planningResult.success) {
      this.recordEvent(input.chainId, {
        kind: "chain_failed",
        chainId: input.chainId,
        message: "Hermes planning failed before task chain execution",
        stub: plan.stub,
      });
      return {
        chainId: input.chainId,
        success: false,
        plan,
        tasks,
        events: this.getEvents(input.chainId),
        executionResults: [],
        stub: plan.stub,
      };
    }

    this.recordEvent(input.chainId, {
      kind: "chain_started",
      chainId: input.chainId,
      message: `Executing ${tasks.length} OpenClaw step(s)`,
      stub: plan.stub,
    });

    const executionResults: AgentResult[] = [];

    for (const descriptor of tasks) {
      this.recordEvent(input.chainId, {
        kind: "step_started",
        chainId: input.chainId,
        stepIndex: descriptor.index,
        stepId: descriptor.stepId,
        message: descriptor.intent.description,
        stub: plan.stub,
      });

      this.options.lifecycle?.emitActivity(input.sessionId, {
        taskId: input.parentTaskId,
        source: "openclaw",
        kind: "execution_progress",
        summary: `Task chain step ${descriptor.index + 1}/${tasks.length}`,
        payload: {
          chainId: input.chainId,
          stepId: descriptor.stepId,
          stepIndex: descriptor.index,
        },
      });

      if (input.timelineId && this.options.timelineRuntime) {
        this.options.timelineRuntime.appendTimelineEvent({
          id: nextEventId("step_started"),
          kind: "action_progress",
          label: TIMELINE_EVENT_LABELS.action_progress,
          message: descriptor.intent.description,
          timestamp: new Date().toISOString(),
          status: "active",
          timelineId: input.timelineId,
          taskId: input.parentTaskId,
        });
      }

      const stepRequestId = `${input.requestId}-step-${descriptor.index}`;
      const result = await this.options.executeOpenClawStep(
        descriptor,
        stepRequestId,
        input.agentContext,
      );

      if (!result) {
        this.recordEvent(input.chainId, {
          kind: "chain_failed",
          chainId: input.chainId,
          stepIndex: descriptor.index,
          stepId: descriptor.stepId,
          message: "OpenClaw agent unavailable for task chain step",
          stub: plan.stub,
        });
        return {
          chainId: input.chainId,
          success: false,
          plan,
          tasks,
          events: this.getEvents(input.chainId),
          executionResults,
          stub: plan.stub,
        };
      }

      executionResults.push(result);

      this.recordEvent(input.chainId, {
        kind: "step_completed",
        chainId: input.chainId,
        stepIndex: descriptor.index,
        stepId: descriptor.stepId,
        message: result.success
          ? "OpenClaw step completed"
          : "OpenClaw step failed",
        stub: plan.stub,
      });

      if (!result.success) {
        this.recordEvent(input.chainId, {
          kind: "chain_failed",
          chainId: input.chainId,
          stepIndex: descriptor.index,
          stepId: descriptor.stepId,
          message: result.error?.message ?? "OpenClaw step failed",
          stub: plan.stub,
        });
        return {
          chainId: input.chainId,
          success: false,
          plan,
          tasks,
          events: this.getEvents(input.chainId),
          executionResults,
          stub: plan.stub,
        };
      }
    }

    this.recordEvent(input.chainId, {
      kind: "chain_completed",
      chainId: input.chainId,
      message: "Task chain completed",
      stub: plan.stub,
    });

    return {
      chainId: input.chainId,
      success: true,
      plan,
      tasks,
      events: this.getEvents(input.chainId),
      executionResults,
      stub: plan.stub,
    };
  }

  subscribeTaskChain(subscriber: TaskChainSubscriber): () => void {
    this.subscribers.set(subscriber.subscriberId, subscriber);
    return () => {
      this.subscribers.delete(subscriber.subscriberId);
    };
  }

  getEvents(chainId: string): readonly TaskChainEvent[] {
    return this.chains.get(chainId) ?? [];
  }

  private recordEvent(
    chainId: string,
    partial: Omit<TaskChainEvent, "eventId" | "timestamp">,
  ): void {
    const event: TaskChainEvent = {
      eventId: nextEventId(partial.kind),
      timestamp: new Date().toISOString(),
      ...partial,
    };

    const bucket = this.chains.get(chainId) ?? [];
    bucket.push(event);
    this.chains.set(chainId, bucket);

    for (const subscriber of this.subscribers.values()) {
      subscriber.onEvent(event);
    }
  }
}

/** Factory for Hermes plan → OpenClaw task chain runtime (Phase 77). */
export function createDefaultTaskChainRuntime(
  options: CreateDefaultTaskChainRuntimeOptions,
): TaskChainRuntime {
  return new DefaultTaskChainRuntime(options);
}

/** @internal test helper */
export function __buildFailedAgentResultForTest(
  descriptor: HermesOpenClawTaskDescriptor,
  requestId: string,
): AgentResult {
  return {
    taskId: descriptor.taskId,
    requestId,
    agentId: "openclaw-gateway",
    success: false,
    error: { code: "STEP_FAILED", message: "Step failed" },
  };
}

/** @internal test helper */
export function __buildSuccessAgentResultForTest(
  descriptor: HermesOpenClawTaskDescriptor,
  requestId: string,
): AgentResult {
  return {
    taskId: descriptor.taskId,
    requestId,
    agentId: "openclaw-gateway",
    success: true,
    payload: { stub: true, stepId: descriptor.stepId },
  };
}

/** @internal test helper */
export function __buildPlanningResultForTest(
  parentTaskId: string,
): AgentResult {
  return {
    taskId: parentTaskId,
    requestId: "req-plan",
    agentId: "hermes",
    success: true,
    payload: {
      stub: true,
      structuredPlan: {
        goal: "Test goal",
        steps: ["Step A", "Step B"],
      },
    },
  };
}

/** @internal re-export labels for tests */
export { TASK_CHAIN_EVENT_LABELS };
