import type {
  ProductivityActivityView,
  ProductivitySuggestionView,
  ProductivityViewState,
} from "./productivity-types";

function readRecord(
  value: unknown,
): Readonly<Record<string, unknown>> | undefined {
  return value && typeof value === "object"
    ? (value as Readonly<Record<string, unknown>>)
    : undefined;
}

function mapActivity(entry: Readonly<Record<string, unknown>>): ProductivityActivityView {
  return {
    kind: String(entry.kind ?? ""),
    userLabel: String(entry.userLabel ?? "Working…"),
    message: String(entry.message ?? ""),
    completed: Boolean(entry.completed),
    timestamp: String(entry.timestamp ?? ""),
  };
}

function mapSuggestion(entry: Readonly<Record<string, unknown>>): ProductivitySuggestionView {
  return {
    message: String(entry.message ?? ""),
    kind: String(entry.kind ?? "follow-up"),
  };
}

/**
 * Maps orchestrator productivity output to user-facing view (Phase 98).
 */
export function mapProductivityFromTaskOutput(
  output: Readonly<Record<string, unknown>> | undefined,
): ProductivityViewState | undefined {
  const productivity = readRecord(output?.productivity);
  if (!productivity) {
    return undefined;
  }

  const activities = Array.isArray(productivity.activities)
    ? productivity.activities
        .map((entry) => readRecord(entry))
        .filter((entry): entry is Readonly<Record<string, unknown>> => Boolean(entry))
        .map(mapActivity)
    : [];

  const suggestions = Array.isArray(productivity.suggestions)
    ? productivity.suggestions
        .map((entry) => readRecord(entry))
        .filter((entry): entry is Readonly<Record<string, unknown>> => Boolean(entry))
        .map(mapSuggestion)
    : [];

  const active = activities.find((entry) => !entry.completed);
  const allComplete = activities.length > 0 && activities.every((entry) => entry.completed);

  return {
    sessionId: typeof productivity.sessionId === "string" ? productivity.sessionId : undefined,
    success: typeof productivity.success === "boolean" ? productivity.success : undefined,
    summary: typeof productivity.summary === "string" ? productivity.summary : undefined,
    activities,
    suggestions,
    taskCount: typeof productivity.taskCount === "number" ? productivity.taskCount : undefined,
    activeLabel: active?.userLabel,
    completed: allComplete || productivity.success === true,
  };
}
