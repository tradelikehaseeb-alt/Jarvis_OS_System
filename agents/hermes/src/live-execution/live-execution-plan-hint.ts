import {
  LIVE_EXECUTION_VALIDATION_COMMANDS,
  type LiveExecutionValidationCommand,
} from "@jarvis/types";

/** Hermes planning hint derived from a live validation command (Phase 84). */
export interface HermesLiveExecutionPlanHint {
  readonly command: LiveExecutionValidationCommand;
  readonly goal: string;
  readonly searchIntent: boolean;
  readonly browserIntent: boolean;
  readonly summaryIntent: boolean;
}

function inferHint(command: LiveExecutionValidationCommand): HermesLiveExecutionPlanHint {
  const lower = command.toLowerCase();

  return {
    command,
    goal: command,
    searchIntent: lower.includes("search") || lower.includes("gold price"),
    browserIntent: lower.includes("open google") || lower.includes("browser"),
    summaryIntent: lower.includes("summarize") || lower.includes("headlines"),
  };
}

/** Resolve Hermes planning hints for live validation commands (Phase 84). */
export function resolveHermesLiveExecutionPlanHint(
  command: string,
): HermesLiveExecutionPlanHint | undefined {
  if (!(LIVE_EXECUTION_VALIDATION_COMMANDS as readonly string[]).includes(command)) {
    return undefined;
  }

  return inferHint(command as LiveExecutionValidationCommand);
}

/** All registered live validation command hints (Phase 84). */
export function listHermesLiveExecutionPlanHints(): readonly HermesLiveExecutionPlanHint[] {
  return LIVE_EXECUTION_VALIDATION_COMMANDS.map((command) => inferHint(command));
}
