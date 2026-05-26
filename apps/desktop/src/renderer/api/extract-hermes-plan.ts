import type { TaskStatusResponse } from "@jarvis/types";

import type {
  HermesPlanView,
  HermesPlanningDetails,
} from "../types/hermes-plan";

/** Agent id for Hermes in orchestrator routing output. */
export const HERMES_AGENT_ID = "hermes";

interface PlanShape {
  readonly goal?: string;
  readonly steps?: readonly string[];
  readonly summary?: string;
}

/**
 * Extract Hermes structured plan from `GET /tasks/{id}` output (Phase 23).
 *
 * Reads `output.agentPayload.structuredPlan` (Phase 22) with fallbacks to `plan`.
 * No network I/O — safe for renderer-only use.
 */
export function extractHermesPlanFromTaskStatus(
  status: TaskStatusResponse,
): HermesPlanView | undefined {
  const output = status.output;
  if (!output) {
    return undefined;
  }

  const routing = output.routing as
    | { selectedAgentId?: string; reason?: string }
    | undefined;
  const agent = output.agent as { agentId?: string } | undefined;
  const agentId = routing?.selectedAgentId ?? agent?.agentId;

  if (agentId !== HERMES_AGENT_ID) {
    return undefined;
  }

  const payload = output.agentPayload as
    | Record<string, unknown>
    | undefined;
  if (!payload) {
    return undefined;
  }

  const structured = payload.structuredPlan as PlanShape | undefined;
  const planBlock = payload.plan as PlanShape | undefined;

  const goal =
    structured?.goal?.trim() ||
    planBlock?.goal?.trim() ||
    planBlock?.summary?.trim();
  const steps = structured?.steps ?? planBlock?.steps;

  if (!goal || !steps?.length) {
    return undefined;
  }

  return {
    goal,
    steps: [...steps],
    agentId: HERMES_AGENT_ID,
  };
}

/**
 * Build planning metadata for the collapsible details section (Phase 23).
 */
export function extractHermesPlanningDetails(
  status: TaskStatusResponse,
): HermesPlanningDetails | undefined {
  const output = status.output;
  if (!output) {
    return undefined;
  }

  const payload = output.agentPayload as Record<string, unknown> | undefined;
  const plan = payload?.plan as { intentKind?: string } | undefined;
  const reasoning = payload?.reasoning as { summary?: string } | undefined;
  const adapter = payload?.adapter as { adapterId?: string; stub?: boolean } | undefined;
  const routing = output.routing as { reason?: string } | undefined;

  return {
    taskStatus: status.status,
    intentKind: plan?.intentKind,
    reasoningSummary: reasoning?.summary,
    adapterId: adapter?.adapterId,
    stub: typeof payload?.stub === "boolean" ? payload.stub : adapter?.stub,
    routingReason: routing?.reason,
  };
}
