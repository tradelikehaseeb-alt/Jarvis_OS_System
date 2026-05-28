import type { WorkforceActivityView, WorkforceActivityViewState } from "./workforce-types";

function readRecord(
  value: unknown,
): Readonly<Record<string, unknown>> | undefined {
  return value && typeof value === "object"
    ? (value as Readonly<Record<string, unknown>>)
    : undefined;
}

function mapActivity(entry: Readonly<Record<string, unknown>>): WorkforceActivityView {
  return {
    workerType: String(entry.workerType ?? ""),
    userLabel: String(entry.userLabel ?? "Working…"),
    message: String(entry.message ?? ""),
    completed: Boolean(entry.completed),
    timestamp: String(entry.timestamp ?? ""),
  };
}

/**
 * Maps orchestrator workforce output to user-facing activity state (Phase 97).
 */
export function mapWorkforceFromTaskOutput(
  output: Readonly<Record<string, unknown>> | undefined,
): WorkforceActivityViewState | undefined {
  const workforce = readRecord(output?.workforce);
  if (!workforce) {
    return undefined;
  }

  const activities = Array.isArray(workforce.activities)
    ? workforce.activities
        .map((entry) => readRecord(entry))
        .filter((entry): entry is Readonly<Record<string, unknown>> => Boolean(entry))
        .map(mapActivity)
    : [];

  const active = activities.find((entry) => !entry.completed);
  const allComplete = activities.length > 0 && activities.every((entry) => entry.completed);

  return {
    sessionId: typeof workforce.sessionId === "string" ? workforce.sessionId : undefined,
    success: typeof workforce.success === "boolean" ? workforce.success : undefined,
    summary: typeof workforce.summary === "string" ? workforce.summary : undefined,
    activities,
    workerCount:
      typeof workforce.workerCount === "number" ? workforce.workerCount : undefined,
    parallel: typeof workforce.parallel === "boolean" ? workforce.parallel : undefined,
    activeLabel: active?.userLabel,
    completed: allComplete || workforce.success === true,
  };
}
