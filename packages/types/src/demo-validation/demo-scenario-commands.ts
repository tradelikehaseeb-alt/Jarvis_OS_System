/** Canonical Phase 96 human demo scenario prompts. */
export const DEMO_SCENARIO_COMMANDS = [
  "Jarvis, open YouTube and summarize AI news",
  "Jarvis, open Gmail and check unread emails",
  "Jarvis, search latest gold market updates",
  "Jarvis, open TradingView and prepare workspace",
  "Jarvis, remember this for later",
] as const;

export type DemoScenarioCommand = (typeof DEMO_SCENARIO_COMMANDS)[number];

export function isDemoScenarioCommand(
  command: string,
): command is DemoScenarioCommand {
  return (DEMO_SCENARIO_COMMANDS as readonly string[]).includes(command);
}

export function normalizeDemoScenarioCommand(command: string): string {
  return command.replace(/^jarvis[,\s]+/i, "").trim();
}
