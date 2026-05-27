import type { ActivityEvent, ActivityEventKind } from "../activity/activity-event";
import { ACTIVITY_EVENT_LABELS } from "../activity/activity-event";

import {
  TIMELINE_STEP_LABELS,
  type TimelineStep,
  type TimelineStepKind,
  type TimelineStepStatus,
} from "./timeline-step";

function mapActivityKind(kind: ActivityEventKind): TimelineStepKind | undefined {
  switch (kind) {
    case "planning_started":
    case "planning_completed":
    case "execution_started":
    case "execution_completed":
    case "failed":
      return kind === "execution_completed" ? "completed" : kind;
    case "memory_saved":
    case "conversation_updated":
      return "action_progress";
    default:
      return undefined;
  }
}

function mapStatus(status: ActivityEvent["status"]): TimelineStepStatus {
  return status;
}

/**
 * Maps desktop activity events to execution timeline steps (Phase 75).
 */
export function mapActivityEventsToTimelineSteps(
  events: readonly ActivityEvent[],
): TimelineStep[] {
  const steps: TimelineStep[] = [];

  for (const event of events) {
    const kind = mapActivityKind(event.kind);
    if (!kind) {
      continue;
    }

    steps.push({
      id: event.id,
      kind,
      label: TIMELINE_STEP_LABELS[kind] ?? ACTIVITY_EVENT_LABELS[event.kind],
      message: event.message,
      timestamp: event.timestamp,
      status: event.kind === "failed" ? "error" : mapStatus(event.status),
    });
  }

  return steps.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export interface ExecutionTimelineEventPayload {
  readonly id?: string;
  readonly kind: string;
  readonly label?: string;
  readonly message?: string;
  readonly timestamp: string;
  readonly status?: TimelineStepStatus;
}

/**
 * Maps orchestrator executionTimeline output to desktop steps.
 */
export function mapExecutionTimelineToSteps(
  events: readonly ExecutionTimelineEventPayload[],
): TimelineStep[] {
  return events
    .map((event) => {
      const kind = event.kind as TimelineStepKind;
      if (!(kind in TIMELINE_STEP_LABELS)) {
        return undefined;
      }

      return {
        id: event.id ?? `${kind}-${event.timestamp}`,
        kind,
        label: event.label ?? TIMELINE_STEP_LABELS[kind],
        message: event.message,
        timestamp: event.timestamp,
        status: event.status ?? (kind === "failed" ? "error" : "complete"),
      };
    })
    .filter((step): step is TimelineStep => step !== undefined)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

/**
 * Computes task progress percent from timeline steps.
 */
export function computeTimelineProgress(steps: readonly TimelineStep[]): number {
  if (steps.length === 0) {
    return 0;
  }

  const completeCount = steps.filter(
    (step) => step.status === "complete" || step.status === "error",
  ).length;

  return Math.min(100, Math.round((completeCount / steps.length) * 100));
}
