import { readHermesRuntimeEnv } from "@jarvis/hermes";

/**
 * When false, automate handshake must not duplicate planning via orchestrator LLM.
 * Hermes agent + adapter owns planning in official/local modes.
 */
export function shouldUseOrchestratorLlmPlanning(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  if (env.JARVIS_ALLOW_ORCHESTRATOR_LLM_PLANNING === "true") {
    return true;
  }
  if (env.JARVIS_ALLOW_ORCHESTRATOR_LLM_PLANNING === "false") {
    return false;
  }

  const mode = readHermesRuntimeEnv(env).mode;
  return mode === "stub";
}
