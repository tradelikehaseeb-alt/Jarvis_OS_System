import type { TaskStatusResponse } from "@jarvis/types";

import type {
  JarvisExecutionFlowResult,
  JarvisExecutionSummary,
} from "./jarvis-execution-flow-result";

function formatResponseMessage(status: TaskStatusResponse): string {
  const skill = status.output?.skill as
    | { skillId?: string; data?: { results?: { title: string }[] } }
    | undefined;

  if (skill?.skillId === "search-skill" && skill.data?.results?.length) {
    const titles = skill.data.results.map((r) => r.title).join(", ");
    return `Task completed. Search results: ${titles}`;
  }

  const plan = status.output?.agentPayload as
    | { structuredPlan?: { goal?: string } }
    | undefined;
  if (plan?.structuredPlan?.goal) {
    return `Plan ready: ${plan.structuredPlan.goal}`;
  }

  const memory = status.output?.memory as { summary?: string } | undefined;
  if (memory?.summary) {
    return memory.summary;
  }

  if (status.status === "failed") {
    return status.error?.message ?? "Task failed";
  }

  return `Task ${status.status}.`;
}

/**
 * Derive a condensed summary from a completed flow result (Phase 50).
 */
export function buildExecutionSummary(
  result: JarvisExecutionFlowResult,
): JarvisExecutionSummary {
  const { record, uiProjection } = result;
  const status = record.taskStatus;
  const lifecycle = status.output?.executionLifecycle as
    | {
        state?: string;
        handshake?: { planningAgentId: string; executionAgentId: string };
      }
    | undefined;

  const routing = status.output?.routing as
    | { handshake?: boolean }
    | undefined;

  const memory = status.output?.memory as { summary?: string } | undefined;

  return {
    taskId: record.createTaskResponse.taskId,
    status: status.status,
    intentKind: result.taskIntent.kind,
    lifecycleState: lifecycle?.state ?? status.status,
    hermesState: uiProjection.agentStatus.hermes,
    openClawState: uiProjection.agentStatus.openClaw,
    memorySummary: memory?.summary,
    responseMessage: formatResponseMessage(status),
    completed: status.status === "completed",
    failed: status.status === "failed",
    handshake: Boolean(routing?.handshake ?? lifecycle?.handshake),
  };
}
