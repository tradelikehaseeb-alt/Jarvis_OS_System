import {
  LIVE_EXECUTION_VALIDATION_COMMANDS,
  REAL_PROVIDER_VALIDATION_COMMANDS,
  type LiveExecutionValidationCommand,
  type RealProviderValidationCommand,
} from "@jarvis/types";

/** Hermes planning hint derived from a live validation command (Phase 84/85). */
export interface HermesLiveExecutionPlanHint {
  readonly command: LiveExecutionValidationCommand | RealProviderValidationCommand;
  readonly goal: string;
  readonly searchIntent: boolean;
  readonly browserIntent: boolean;
  readonly summaryIntent: boolean;
}

type ProviderValidationCommand =
  | LiveExecutionValidationCommand
  | RealProviderValidationCommand;

const ALL_PROVIDER_VALIDATION_COMMANDS: readonly string[] = [
  ...LIVE_EXECUTION_VALIDATION_COMMANDS,
  ...REAL_PROVIDER_VALIDATION_COMMANDS,
];

function inferHint(command: ProviderValidationCommand): HermesLiveExecutionPlanHint {
  const lower = command.toLowerCase();

  return {
    command,
    goal: command,
    searchIntent:
      lower.includes("search") ||
      lower.includes("gold price") ||
      lower.includes("bitcoin"),
    browserIntent: lower.includes("open google") || lower.includes("browser"),
    summaryIntent:
      lower.includes("summarize") ||
      lower.includes("headlines") ||
      lower.includes("explain") ||
      lower.includes("trend"),
  };
}

/** Resolve Hermes planning hints for live validation commands (Phase 84/85). */
export function resolveHermesLiveExecutionPlanHint(
  command: string,
): HermesLiveExecutionPlanHint | undefined {
  if (!ALL_PROVIDER_VALIDATION_COMMANDS.includes(command)) {
    return undefined;
  }

  return inferHint(command as ProviderValidationCommand);
}

/** All registered live validation command hints (Phase 84/85). */
export function listHermesLiveExecutionPlanHints(): readonly HermesLiveExecutionPlanHint[] {
  return ALL_PROVIDER_VALIDATION_COMMANDS.map((command) =>
    inferHint(command as ProviderValidationCommand),
  );
}
