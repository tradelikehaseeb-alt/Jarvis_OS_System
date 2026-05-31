import type {
  HermesExecutionPlanStep,
  HermesStructuredPlan,
} from "../../adapter/src/hermes-response";

import type {
  CreateExecutionPlanInput,
  HermesExecutionBridge,
  MapPlanToTasksInput,
} from "./hermes-execution-bridge";
import type { HermesExecutionPlan } from "./hermes-execution-plan";
import type { HermesExecutionStep } from "./hermes-execution-step";
import type { HermesOpenClawTaskDescriptor } from "./hermes-openclaw-task-descriptor";

const STUB_FALLBACK_STEPS = [
  "stub-plan",
  "stub-review",
  "stub-execute-via-skills",
] as const;

function readRecord(
  payload: Readonly<Record<string, unknown>> | undefined,
  key: string,
): Readonly<Record<string, unknown>> | undefined {
  const value = payload?.[key];
  return value && typeof value === "object"
    ? (value as Readonly<Record<string, unknown>>)
    : undefined;
}

function readStructuredPlanFromPayload(
  payload: Readonly<Record<string, unknown>> | undefined,
): HermesStructuredPlan | undefined {
  const structured = readRecord(payload, "structuredPlan") ??
    readRecord(payload, "plan");
  if (
    !structured ||
    typeof structured.goal !== "string" ||
    !Array.isArray(structured.steps)
  ) {
    return undefined;
  }

  const steps = structured.steps.filter(
    (step): step is string => typeof step === "string" && step.trim().length > 0,
  );
  if (steps.length === 0) {
    return undefined;
  }

  const executionSteps = Array.isArray(structured.executionSteps)
    ? normalizeExecutionSteps(structured.executionSteps)
    : undefined;

  return {
    goal: structured.goal,
    steps,
    ...(executionSteps && executionSteps.length > 0 ? { executionSteps } : {}),
  };
}

function normalizeExecutionSteps(
  steps: readonly unknown[],
): readonly HermesExecutionPlanStep[] {
  const normalized: HermesExecutionPlanStep[] = [];
  for (const [index, value] of steps.entries()) {
    if (!value || typeof value !== "object") {
      continue;
    }
    const step = value as Readonly<Record<string, unknown>>;
    const action = String(step.action ?? "").trim();
    if (!action) {
      continue;
    }
    normalized.push({
      stepId: String(step.stepId ?? index + 1),
      agent:
        String(step.agent ?? "").trim().toLowerCase() === "hermes"
          ? "hermes"
          : "openclaw",
      skill: normalizeSkill(step.skill),
      action,
      params:
        step.params && typeof step.params === "object"
          ? (step.params as Readonly<Record<string, unknown>>)
          : {},
      dependsOn: Array.isArray(step.dependsOn)
        ? (step.dependsOn.map(String) as readonly string[])
        : [],
    });
  }
  return normalized;
}

function normalizeSkill(value: unknown): HermesExecutionPlanStep["skill"] {
  switch (String(value ?? "").trim().toLowerCase()) {
    case "browser":
      return "browser";
    case "file":
      return "file";
    case "memory":
      return "memory";
    case "reminder":
      return "reminder";
    case "search":
    default:
      return "search";
  }
}

function detectStub(
  payload: Readonly<Record<string, unknown>> | undefined,
  plan?: HermesStructuredPlan,
): boolean {
  if (payload?.stub === true) {
    return true;
  }

  const gateway = readRecord(payload, "gateway");
  if (gateway?.stub === true) {
    return true;
  }

  const adapter = readRecord(payload, "adapter");
  if (adapter?.stub === true) {
    return true;
  }

  return (
    plan?.steps.some((step) => step.toLowerCase().includes("stub")) ?? false
  );
}

function buildSteps(
  parentTaskId: string,
  labels: readonly string[],
  stub: boolean,
  executionSteps?: readonly HermesExecutionPlanStep[],
): HermesExecutionStep[] {
  return labels.map((label, index) => ({
    stepId: `${parentTaskId}-step-${index}`,
    index,
    label,
    description: label,
    stub,
    ...(executionSteps?.[index]
      ? {
          agent: executionSteps[index].agent,
          skill: executionSteps[index].skill,
          action: executionSteps[index].action,
          params: executionSteps[index].params,
          dependsOn: executionSteps[index].dependsOn,
        }
      : {}),
  }));
}

function buildStubFallbackPlan(parentTaskId: string): HermesExecutionPlan {
  return {
    planId: `exec-plan-${parentTaskId}`,
    goal: "Stub execution plan",
    steps: buildSteps(parentTaskId, STUB_FALLBACK_STEPS, true),
    stub: true,
    source: "stub_fallback",
  };
}

class DefaultHermesExecutionBridge implements HermesExecutionBridge {
  createExecutionPlan(input: CreateExecutionPlanInput): HermesExecutionPlan {
    const structured =
      input.structuredPlan ??
      readStructuredPlanFromPayload(input.agentPayload);

    if (!structured) {
      return buildStubFallbackPlan(input.parentTaskId);
    }

    const stub = detectStub(input.agentPayload, structured);
    return {
      planId: `exec-plan-${input.parentTaskId}`,
      goal: structured.goal,
      steps: buildSteps(
        input.parentTaskId,
        structured.steps,
        stub,
        structured.executionSteps,
      ),
      stub,
      source: input.structuredPlan ? "structured_plan" : "agent_payload",
    };
  }

  mapPlanToTasks(
    input: MapPlanToTasksInput,
  ): readonly HermesOpenClawTaskDescriptor[] {
    return input.plan.steps.map((step) => ({
      taskId: step.stepId,
      stepId: step.stepId,
      index: step.index,
      intent: {
        kind: "automate",
        description: input.plan.goal
          ? `${input.plan.goal} — ${step.label}`
          : step.label,
      },
      metadata: {
        executionBridge: true,
        planId: input.plan.planId,
        parentTaskId: input.parentTaskId,
        stepIndex: step.index,
        stub: input.plan.stub,
        hermesStep: {
          agent: step.agent,
          skill: step.skill,
          action: step.action,
          params: step.params,
          dependsOn: step.dependsOn,
        },
        skill: step.skill,
        action: step.action,
        params: step.params,
        dependsOn: step.dependsOn,
        userId: input.userId,
        correlationId: input.correlationId,
      },
    }));
  }
}

/** Factory for default Hermes → OpenClaw execution bridge (Phase 77). */
export function createDefaultHermesExecutionBridge(): HermesExecutionBridge {
  return new DefaultHermesExecutionBridge();
}

/** @internal test helper */
export function __readStructuredPlanFromPayloadForTest(
  payload: Readonly<Record<string, unknown>> | undefined,
): HermesStructuredPlan | undefined {
  return readStructuredPlanFromPayload(payload);
}
