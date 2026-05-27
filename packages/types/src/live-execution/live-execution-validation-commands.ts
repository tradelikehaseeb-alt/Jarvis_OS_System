/** Canonical live execution validation commands (Phase 84). */
export const LIVE_EXECUTION_VALIDATION_COMMANDS = [
  "Search gold price today",
  "Open Google and search AI news",
  "Summarize latest technology headlines",
] as const;

export type LiveExecutionValidationCommand =
  (typeof LIVE_EXECUTION_VALIDATION_COMMANDS)[number];

export function isLiveExecutionValidationCommand(
  command: string,
): command is LiveExecutionValidationCommand {
  return (LIVE_EXECUTION_VALIDATION_COMMANDS as readonly string[]).includes(
    command,
  );
}
