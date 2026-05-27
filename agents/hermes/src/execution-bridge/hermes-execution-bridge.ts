import type { HermesStructuredPlan } from "../../adapter/src/hermes-response";

import type { HermesExecutionPlan } from "./hermes-execution-plan";
import type { HermesOpenClawTaskDescriptor } from "./hermes-openclaw-task-descriptor";

export interface CreateExecutionPlanInput {
  readonly parentTaskId: string;
  readonly structuredPlan?: HermesStructuredPlan;
  readonly agentPayload?: Readonly<Record<string, unknown>>;
}

export interface MapPlanToTasksInput {
  readonly plan: HermesExecutionPlan;
  readonly parentTaskId: string;
  readonly userId: string;
  readonly correlationId?: string;
}

/**
 * Converts Hermes structured plans into OpenClaw task chains (Phase 77).
 */
export interface HermesExecutionBridge {
  createExecutionPlan(input: CreateExecutionPlanInput): HermesExecutionPlan;
  mapPlanToTasks(
    input: MapPlanToTasksInput,
  ): readonly HermesOpenClawTaskDescriptor[];
}
