/** Phase 100 real-world voice and browser validation commands. */
export const REAL_WORLD_VOICE_COMMANDS = [
  "Jarvis, open YouTube and search AI news",
  "Jarvis, summarize latest gold market updates",
  "Jarvis, open Gmail",
  "Jarvis, prepare trading research workspace",
] as const;

export type RealWorldVoiceCommand = (typeof REAL_WORLD_VOICE_COMMANDS)[number];

/** Providers validated as primary execution path (Phase 100). */
export const REAL_WORLD_PROVIDER_IDS = [
  "openrouter",
  "groq",
  "gemini",
  "openai",
  "deepseek",
] as const;

export type RealWorldProviderId = (typeof REAL_WORLD_PROVIDER_IDS)[number];

export const REAL_WORLD_VALIDATION_COMMANDS = [
  ...REAL_WORLD_VOICE_COMMANDS,
  "What is the gold price today?",
  "Summarize AI news",
] as const;

export type RealWorldValidationCommand = (typeof REAL_WORLD_VALIDATION_COMMANDS)[number];

export function isRealWorldValidationCommand(
  command: string,
): command is RealWorldValidationCommand {
  return (REAL_WORLD_VALIDATION_COMMANDS as readonly string[]).includes(command);
}

export function isRealWorldVoiceCommand(command: string): command is RealWorldVoiceCommand {
  return (REAL_WORLD_VOICE_COMMANDS as readonly string[]).includes(command);
}

export function normalizeRealWorldCommand(command: string): string {
  return command.replace(/^jarvis[,\s]+/i, "").trim();
}
