import type {
  ContinuousActivityView,
  ContinuousNotificationView,
  ContinuousViewState,
} from "./continuous-types";

function readRecord(
  value: unknown,
): Readonly<Record<string, unknown>> | undefined {
  return value && typeof value === "object"
    ? (value as Readonly<Record<string, unknown>>)
    : undefined;
}

function mapActivity(entry: Readonly<Record<string, unknown>>): ContinuousActivityView {
  return {
    kind: String(entry.kind ?? ""),
    userLabel: String(entry.userLabel ?? "Working…"),
    message: String(entry.message ?? ""),
    background: Boolean(entry.background),
    completed: Boolean(entry.completed),
    timestamp: String(entry.timestamp ?? ""),
  };
}

function mapNotification(entry: Readonly<Record<string, unknown>>): ContinuousNotificationView {
  return {
    message: String(entry.message ?? ""),
    userLabel: String(entry.userLabel ?? ""),
    kind: String(entry.kind ?? "alert"),
  };
}

/**
 * Maps orchestrator continuous output to user-facing view (Phase 99).
 */
export function mapContinuousFromTaskOutput(
  output: Readonly<Record<string, unknown>> | undefined,
): ContinuousViewState | undefined {
  const continuous = readRecord(output?.continuous);
  if (!continuous) {
    return undefined;
  }

  const activities = Array.isArray(continuous.activities)
    ? continuous.activities
        .map((entry) => readRecord(entry))
        .filter((entry): entry is Readonly<Record<string, unknown>> => Boolean(entry))
        .map(mapActivity)
    : [];

  const notifications = Array.isArray(continuous.notifications)
    ? continuous.notifications
        .map((entry) => readRecord(entry))
        .filter((entry): entry is Readonly<Record<string, unknown>> => Boolean(entry))
        .map(mapNotification)
    : [];

  const active = activities.find((entry) => !entry.completed);
  const allComplete = activities.length > 0 && activities.every((entry) => entry.completed);

  return {
    sessionId: typeof continuous.sessionId === "string" ? continuous.sessionId : undefined,
    success: typeof continuous.success === "boolean" ? continuous.success : undefined,
    summary: typeof continuous.summary === "string" ? continuous.summary : undefined,
    activities,
    notifications,
    backgroundTaskCount:
      typeof continuous.backgroundTaskCount === "number"
        ? continuous.backgroundTaskCount
        : undefined,
    continuous: typeof continuous.continuous === "boolean" ? continuous.continuous : undefined,
    presence: typeof continuous.presence === "string" ? continuous.presence : undefined,
    activeLabel: active?.userLabel,
    completed: allComplete || continuous.success === true,
  };
}
