import { isDemoScenarioCommand } from "@jarvis/types";

export interface HermesDemoInteractionHint {
  readonly isDemoScenario: boolean;
  readonly prefersBrowserWorkflow: boolean;
  readonly prefersMemoryCapture: boolean;
  readonly planningFocus: string;
}

/**
 * Adjusts Hermes planning context for canonical demo scenarios (Phase 96).
 */
export function evaluateHermesDemoInteraction(description: string): HermesDemoInteractionHint {
  const lower = description.toLowerCase();
  const isDemoScenario = isDemoScenarioCommand(description) || lower.startsWith("jarvis,");

  return {
    isDemoScenario,
    prefersBrowserWorkflow: /\b(open|navigate|prepare|check)\b/i.test(description),
    prefersMemoryCapture: /\bremember\b/i.test(description),
    planningFocus: isDemoScenario
      ? "Prioritize clear step-by-step execution suitable for live demo"
      : "Standard planning",
  };
}
