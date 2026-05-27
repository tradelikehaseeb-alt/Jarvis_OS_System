import type { AgentResult } from "@jarvis/agents-shared";
import type { HermesExecutionPlan, HermesExecutionStep } from "@jarvis/hermes";

import type { ExecutionLifecycleManager } from "../execution/execution-lifecycle-manager";
import type { TimelineRuntime } from "../timeline/timeline-runtime";
import { TIMELINE_EVENT_LABELS } from "../timeline/timeline-event";
import type {
  OpenClawStepExecutor,
  TaskChainRuntime,
} from "../task-chain";

import type { AdaptiveExecutionDecision } from "./adaptive-execution-decision";
import {
  ADAPTIVE_EXECUTION_EVENT_LABELS,
  type AdaptiveExecutionEvent,
  type AdaptiveExecutionEventKind,
} from "./adaptive-execution-event";
import {
  DEFAULT_STUB_ADAPTIVE_RULES,
  type AdaptiveExecutionRule,
} from "./adaptive-execution-rule";
import type {
  AdaptiveExecuteInput,
  AdaptiveExecuteResult,
  AdaptiveExecutionRuntime,
  AdaptiveExecutionSubscriber,
  EvaluateExecutionInput,
  ModifyExecutionPlanInput,
  RetryExecutionInput,
  SelectNextStepInput,
} from "./adaptive-execution-runtime";

export interface CreateDefaultAdaptiveExecutionRuntimeOptions {
  readonly taskChainRuntime: TaskChainRuntime;
  readonly executeOpenClawStep: OpenClawStepExecutor["executeStep"];
  readonly lifecycle?: ExecutionLifecycleManager;
  readonly timelineRuntime?: TimelineRuntime;
  readonly defaultRules?: readonly AdaptiveExecutionRule[];
}

let eventCounter = 0;

function nextEventId(kind: AdaptiveExecutionEventKind): string {
  eventCounter += 1;
  return `adaptive-${kind}-${eventCounter}`;
}

function buildStepsFromLabels(
  parentTaskId: string,
  labels: readonly string[],
  stub: boolean,
  startIndex = 0,
): HermesExecutionStep[] {
  return labels.map((label, offset) => ({
    stepId: `${parentTaskId}-step-${startIndex + offset}`,
    index: startIndex + offset,
    label,
    description: label,
    stub,
  }));
}

function reindexSteps(steps: readonly HermesExecutionStep[]): HermesExecutionStep[] {
  return steps.map((step, index) => ({
    ...step,
    index,
    stepId: step.stepId.replace(/-step-\d+$/, `-step-${index}`),
  }));
}

class DefaultAdaptiveExecutionRuntime implements AdaptiveExecutionRuntime {
  private readonly rules: readonly AdaptiveExecutionRule[];
  private readonly buckets = new Map<string, AdaptiveExecutionEvent[]>();
  private readonly subscribers = new Map<string, AdaptiveExecutionSubscriber>();

  constructor(private readonly options: CreateDefaultAdaptiveExecutionRuntimeOptions) {
    this.rules = options.defaultRules ?? DEFAULT_STUB_ADAPTIVE_RULES;
  }

  evaluateExecution(input: EvaluateExecutionInput): AdaptiveExecutionDecision {
    const rules = input.rules ?? this.rules;
    const trigger = input.stepResult.success ? "step_succeeded" : "step_failed";

    for (const rule of rules) {
      if (rule.when !== trigger && rule.when !== "always") {
        continue;
      }

      if (rule.action === "continue" && input.stepResult.success) {
        const isLast = input.stepIndex >= input.plan.steps.length - 1;
        return {
          kind: isLast ? "complete" : "continue",
          reason: isLast
            ? "Final step succeeded"
            : "Step succeeded — continue chain",
          ruleId: rule.ruleId,
        };
      }

      if (rule.action === "retry" && !input.stepResult.success) {
        const maxRetries = rule.maxRetries ?? 1;
        if (input.retryCount < maxRetries) {
          return {
            kind: "retry",
            reason: `Step failed — retry ${input.retryCount + 1}/${maxRetries}`,
            ruleId: rule.ruleId,
            retryCount: input.retryCount + 1,
          };
        }
        continue;
      }

      if (rule.action === "modify_plan" && !input.stepResult.success) {
        const parentTaskId =
          typeof input.descriptor.metadata?.parentTaskId === "string"
            ? input.descriptor.metadata.parentTaskId
            : input.plan.planId.replace(/^exec-plan-/, "");
        const remaining =
          rule.modifySteps ??
          input.plan.steps.slice(input.stepIndex + 1).map((step) => step.label);
        const modifiedPlan = this.modifyExecutionPlan({
          plan: input.plan,
          parentTaskId,
          completedStepCount: input.stepIndex,
          newRemainingSteps: remaining,
        });
        return {
          kind: "modify_plan",
          reason: "Step failed — execution plan modified",
          ruleId: rule.ruleId,
          modifiedPlan,
        };
      }

      if (rule.action === "abort" && !input.stepResult.success) {
        return {
          kind: "abort",
          reason: input.stepResult.error?.message ?? "Step failed — abort chain",
          ruleId: rule.ruleId,
        };
      }
    }

    if (input.stepResult.success) {
      const isLast = input.stepIndex >= input.plan.steps.length - 1;
      return {
        kind: isLast ? "complete" : "continue",
        reason: "Default continue on success",
      };
    }

    return {
      kind: "abort",
      reason: input.stepResult.error?.message ?? "Step failed — no matching rule",
    };
  }

  selectNextStep(
    input: SelectNextStepInput,
  ): ReturnType<AdaptiveExecutionRuntime["selectNextStep"]> {
    if (
      input.decision.kind === "abort" ||
      input.decision.kind === "complete" ||
      input.decision.kind === "retry" ||
      input.decision.kind === "modify_plan"
    ) {
      return undefined;
    }

    const nextIndex = input.currentIndex + 1;
    return input.tasks[nextIndex];
  }

  async retryExecution(
    input: RetryExecutionInput,
  ): Promise<AgentResult | undefined> {
    const stepRequestId = `${input.requestId}-retry-${input.retryCount}`;
    return this.options.executeOpenClawStep(
      input.descriptor,
      stepRequestId,
      input.agentContext,
    );
  }

  modifyExecutionPlan(input: ModifyExecutionPlanInput): HermesExecutionPlan {
    const kept = input.plan.steps.slice(0, input.completedStepCount);
    const appended = buildStepsFromLabels(
      input.parentTaskId,
      input.newRemainingSteps,
      input.plan.stub,
      kept.length,
    );
    const steps = reindexSteps([...kept, ...appended]);

    return {
      ...input.plan,
      steps,
    };
  }

  async executeAdaptively(
    input: AdaptiveExecuteInput,
  ): Promise<AdaptiveExecuteResult> {
    const executionId = input.executionId ?? input.chainId;

    if (input.useFixedChain) {
      const taskChainResult = await this.options.taskChainRuntime.executeTaskChain(
        input,
      );
      return {
        executionId,
        success: taskChainResult.success,
        plan: taskChainResult.plan,
        tasks: taskChainResult.tasks,
        executionResults: taskChainResult.executionResults,
        decisions: [],
        events: this.getEvents(executionId),
        taskChainResult,
        stub: taskChainResult.stub,
        adaptive: true,
      };
    }

    const plan = this.options.taskChainRuntime.createExecutionPlan({
      parentTaskId: input.parentTaskId,
      agentPayload: input.planningResult.payload as
        | Readonly<Record<string, unknown>>
        | undefined,
    });

    let currentPlan = plan;
    let tasks = [
      ...this.options.taskChainRuntime.mapPlanToTasks({
        plan: currentPlan,
        parentTaskId: input.parentTaskId,
        userId: input.userId,
        correlationId: input.correlationId,
      }),
    ];

    if (!input.planningResult.success) {
      this.recordEvent(executionId, {
        kind: "execution_failed",
        executionId,
        message: "Hermes planning failed before adaptive execution",
        stub: plan.stub,
      });
      return {
        executionId,
        success: false,
        plan: currentPlan,
        tasks,
        executionResults: [],
        decisions: [],
        events: this.getEvents(executionId),
        stub: plan.stub,
        adaptive: true,
      };
    }

    const decisions: AdaptiveExecutionDecision[] = [];
    const executionResults: AgentResult[] = [];
    let stepIndex = 0;
    let retryCount = 0;

    while (stepIndex < tasks.length) {
      const descriptor = tasks[stepIndex]!;

      this.recordEvent(executionId, {
        kind: "evaluation_started",
        executionId,
        stepIndex: descriptor.index,
        stepId: descriptor.stepId,
        message: descriptor.intent.description,
        stub: currentPlan.stub,
      });

      this.emitProgress(input, descriptor, stepIndex, tasks.length);

      const stepRequestId = `${input.requestId}-step-${descriptor.index}`;
      let stepResult = await this.options.executeOpenClawStep(
        descriptor,
        stepRequestId,
        input.agentContext,
      );

      if (!stepResult) {
        this.recordEvent(executionId, {
          kind: "execution_failed",
          executionId,
          stepIndex: descriptor.index,
          stepId: descriptor.stepId,
          message: "OpenClaw agent unavailable",
          stub: currentPlan.stub,
        });
        return this.buildResult(
          executionId,
          false,
          currentPlan,
          tasks,
          executionResults,
          decisions,
          currentPlan.stub,
        );
      }

      executionResults.push(stepResult);

      let decision = this.evaluateExecution({
        stepResult,
        descriptor,
        stepIndex,
        retryCount,
        plan: currentPlan,
        rules: input.rules,
      });
      decisions.push(decision);
      this.recordDecision(executionId, descriptor, decision, currentPlan.stub);

      while (decision.kind === "retry") {
        retryCount = decision.retryCount ?? retryCount + 1;
        this.recordEvent(executionId, {
          kind: "retry_started",
          executionId,
          stepIndex: descriptor.index,
          stepId: descriptor.stepId,
          message: decision.reason,
          stub: currentPlan.stub,
          decisionKind: decision.kind,
        });

        const retried = await this.retryExecution({
          descriptor,
          requestId: input.requestId,
          agentContext: input.agentContext,
          retryCount,
        });

        if (!retried) {
          return this.buildResult(
            executionId,
            false,
            currentPlan,
            tasks,
            executionResults,
            decisions,
            currentPlan.stub,
          );
        }

        stepResult = retried;
        executionResults[executionResults.length - 1] = retried;
        decision = this.evaluateExecution({
          stepResult,
          descriptor,
          stepIndex,
          retryCount,
          plan: currentPlan,
          rules: input.rules,
        });
        decisions.push(decision);
        this.recordDecision(executionId, descriptor, decision, currentPlan.stub);
      }

      if (decision.kind === "modify_plan" && decision.modifiedPlan) {
        currentPlan = decision.modifiedPlan;
        tasks = [
          ...this.options.taskChainRuntime.mapPlanToTasks({
            plan: currentPlan,
            parentTaskId: input.parentTaskId,
            userId: input.userId,
            correlationId: input.correlationId,
          }),
        ];
        this.recordEvent(executionId, {
          kind: "plan_modified",
          executionId,
          stepIndex: descriptor.index,
          message: `Plan modified — ${tasks.length} step(s) remaining`,
          stub: currentPlan.stub,
          decisionKind: decision.kind,
        });
        stepIndex += 1;
        retryCount = 0;
        continue;
      }

      if (decision.kind === "abort") {
        this.recordEvent(executionId, {
          kind: "execution_failed",
          executionId,
          stepIndex: descriptor.index,
          stepId: descriptor.stepId,
          message: decision.reason,
          stub: currentPlan.stub,
          decisionKind: decision.kind,
        });
        return this.buildResult(
          executionId,
          false,
          currentPlan,
          tasks,
          executionResults,
          decisions,
          currentPlan.stub,
        );
      }

      if (decision.kind === "complete") {
        this.recordEvent(executionId, {
          kind: "execution_completed",
          executionId,
          message: decision.reason,
          stub: currentPlan.stub,
          decisionKind: decision.kind,
        });
        return this.buildResult(
          executionId,
          true,
          currentPlan,
          tasks,
          executionResults,
          decisions,
          currentPlan.stub,
        );
      }

      const next = this.selectNextStep({
        tasks,
        currentIndex: stepIndex,
        decision,
      });

      if (next) {
        this.recordEvent(executionId, {
          kind: "step_selected",
          executionId,
          stepIndex: next.index,
          stepId: next.stepId,
          message: next.intent.description,
          stub: currentPlan.stub,
          decisionKind: decision.kind,
        });
      }

      stepIndex += 1;
      retryCount = 0;
    }

    this.recordEvent(executionId, {
      kind: "execution_completed",
      executionId,
      message: "Adaptive execution completed",
      stub: currentPlan.stub,
    });

    return this.buildResult(
      executionId,
      executionResults.every((result) => result.success),
      currentPlan,
      tasks,
      executionResults,
      decisions,
      currentPlan.stub,
    );
  }

  subscribeAdaptiveExecution(
    subscriber: AdaptiveExecutionSubscriber,
  ): () => void {
    this.subscribers.set(subscriber.subscriberId, subscriber);
    return () => {
      this.subscribers.delete(subscriber.subscriberId);
    };
  }

  getEvents(executionId: string): readonly AdaptiveExecutionEvent[] {
    return this.buckets.get(executionId) ?? [];
  }

  private buildResult(
    executionId: string,
    success: boolean,
    plan: HermesExecutionPlan,
    tasks: readonly import("@jarvis/hermes").HermesOpenClawTaskDescriptor[],
    executionResults: readonly AgentResult[],
    decisions: readonly AdaptiveExecutionDecision[],
    stub: boolean,
  ): AdaptiveExecuteResult {
    return {
      executionId,
      success,
      plan,
      tasks,
      executionResults,
      decisions,
      events: this.getEvents(executionId),
      stub,
      adaptive: true,
    };
  }

  private emitProgress(
    input: AdaptiveExecuteInput,
    descriptor: import("@jarvis/hermes").HermesOpenClawTaskDescriptor,
    stepIndex: number,
    totalSteps: number,
  ): void {
    this.options.lifecycle?.emitActivity(input.sessionId, {
      taskId: input.parentTaskId,
      source: "openclaw",
      kind: "execution_progress",
      summary: `Adaptive step ${stepIndex + 1}/${totalSteps}`,
      payload: {
        executionId: input.executionId ?? input.chainId,
        stepId: descriptor.stepId,
        stepIndex: descriptor.index,
        adaptive: true,
      },
    });

    if (input.timelineId && this.options.timelineRuntime) {
      this.options.timelineRuntime.appendTimelineEvent({
        id: nextEventId("evaluation_started"),
        kind: "action_progress",
        label: TIMELINE_EVENT_LABELS.action_progress,
        message: descriptor.intent.description,
        timestamp: new Date().toISOString(),
        status: "active",
        timelineId: input.timelineId,
        taskId: input.parentTaskId,
      });
    }
  }

  private recordDecision(
    executionId: string,
    descriptor: import("@jarvis/hermes").HermesOpenClawTaskDescriptor,
    decision: AdaptiveExecutionDecision,
    stub: boolean,
  ): void {
    this.recordEvent(executionId, {
      kind: "decision_made",
      executionId,
      stepIndex: descriptor.index,
      stepId: descriptor.stepId,
      message: decision.reason,
      stub,
      decisionKind: decision.kind,
    });
  }

  private recordEvent(
    executionId: string,
    partial: Omit<AdaptiveExecutionEvent, "eventId" | "timestamp">,
  ): void {
    const event: AdaptiveExecutionEvent = {
      eventId: nextEventId(partial.kind),
      timestamp: new Date().toISOString(),
      ...partial,
    };

    const bucket = this.buckets.get(executionId) ?? [];
    bucket.push(event);
    this.buckets.set(executionId, bucket);

    for (const subscriber of this.subscribers.values()) {
      subscriber.onEvent(event);
    }
  }
}

/** Factory for adaptive task execution runtime (Phase 78). */
export function createDefaultAdaptiveExecutionRuntime(
  options: CreateDefaultAdaptiveExecutionRuntimeOptions,
): AdaptiveExecutionRuntime {
  return new DefaultAdaptiveExecutionRuntime(options);
}

/** @internal test helper */
export function __buildEvaluateInputForTest(
  success: boolean,
  stepIndex: number,
  retryCount: number,
  plan: HermesExecutionPlan,
  descriptor: import("@jarvis/hermes").HermesOpenClawTaskDescriptor,
): EvaluateExecutionInput {
  return {
    stepResult: {
      taskId: descriptor.taskId,
      requestId: "req-test",
      agentId: "openclaw-gateway",
      success,
      error: success ? undefined : { code: "STEP_FAILED", message: "failed" },
    },
    descriptor,
    stepIndex,
    retryCount,
    plan,
  };
}

/** @internal re-export for tests */
export { ADAPTIVE_EXECUTION_EVENT_LABELS, DEFAULT_STUB_ADAPTIVE_RULES };
