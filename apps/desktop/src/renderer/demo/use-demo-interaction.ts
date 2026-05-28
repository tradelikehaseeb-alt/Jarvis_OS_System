import { useMemo } from "react";
import { isDemoScenarioCommand } from "@jarvis/types";

export interface UseDemoInteractionOptions {
  readonly command?: string;
  readonly loading?: boolean;
  readonly progress?: number;
  readonly displayMessage?: string;
}

export interface UseDemoInteractionResult {
  readonly isDemoScenario: boolean;
  readonly demoPhase: string;
  readonly demoMessage?: string;
  readonly showDemoFlow: boolean;
}

/**
 * Derives demo interaction presentation state for command center (Phase 96).
 */
export function useDemoInteraction(
  options: UseDemoInteractionOptions = {},
): UseDemoInteractionResult {
  const isDemoScenario = useMemo(
    () => Boolean(options.command && isDemoScenarioCommand(options.command)),
    [options.command],
  );

  const demoPhase = options.loading ? "Executing" : "Ready";
  const showDemoFlow = isDemoScenario && (options.loading || (options.progress ?? 0) > 0);

  return {
    isDemoScenario,
    demoPhase,
    demoMessage: options.displayMessage,
    showDemoFlow,
  };
}
