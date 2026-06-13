import {
  hasGroqCredentialsForHermesAgent,
  isHermesPythonAgentConfigured,
  readHermesRuntimeEnv,
  resolveHermesAgentRoot,
  shouldUseHermesPythonAdapter,
} from "@jarvis/hermes";

export interface HermesStartupStatus {
  readonly connected: boolean;
  readonly label: string;
  readonly detail: string;
  readonly adapterId: string;
  readonly agentRoot: string;
}

/**
 * Startup Hermes status for desktop UI (Python agent vs HTTP gateway).
 */
export function getHermesStartupStatus(): HermesStartupStatus {
  const env = process.env;
  const runtime = readHermesRuntimeEnv(env);
  const agentRoot = resolveHermesAgentRoot(env);
  const usePython = shouldUseHermesPythonAdapter(env);

  if (usePython && agentRoot) {
    return {
      connected: true,
      label: "Jarvis core: Online",
      detail: `Python agent at ${agentRoot}`,
      adapterId: "hermes-adapter-python",
      agentRoot,
    };
  }

  if (isHermesPythonAgentConfigured(env)) {
    return {
      connected: true,
      label: "Jarvis core: Online",
      detail: "Python agent configured",
      adapterId: "hermes-adapter-python",
      agentRoot,
    };
  }

  const hints: string[] = [];
  if (env.HERMES_USE_PYTHON_AGENT !== "true") {
    hints.push("HERMES_USE_PYTHON_AGENT=true");
  }
  if (!agentRoot) {
    hints.push("HERMES_AGENT_PATH → folder containing run_agent.py");
  }
  if (!hasGroqCredentialsForHermesAgent(env)) {
    hints.push("GROQ_API_KEY or JARVIS_GROQ_API_KEY");
  }

  return {
    connected: false,
    label: "Jarvis core: Offline",
    detail:
      hints.length > 0
        ? `Missing: ${hints.join("; ")}`
        : `mode=${runtime.mode} — check .env at repo root`,
    adapterId: "none",
    agentRoot,
  };
}
