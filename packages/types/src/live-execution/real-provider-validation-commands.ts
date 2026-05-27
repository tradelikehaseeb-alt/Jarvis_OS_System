/** Real provider validation commands for Phase 85 live checks. */
export const REAL_PROVIDER_VALIDATION_COMMANDS = [
  "What is the gold price today?",
  "Summarize latest AI news",
  "Explain current Bitcoin trend",
] as const;

export type RealProviderValidationCommand =
  (typeof REAL_PROVIDER_VALIDATION_COMMANDS)[number];

export function isRealProviderValidationCommand(
  command: string,
): command is RealProviderValidationCommand {
  return (REAL_PROVIDER_VALIDATION_COMMANDS as readonly string[]).includes(
    command,
  );
}
