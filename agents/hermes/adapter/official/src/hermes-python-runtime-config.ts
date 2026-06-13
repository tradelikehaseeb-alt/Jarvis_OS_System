import {
  hasGroqCredentialsForHermesAgent,
  resolveHermesAgentRoot,
} from "./hermes-python-process-runner";
import type { EnvSource } from "./hermes-runtime-env";

/** True when the Nous `hermes-agent` checkout is configured for subprocess planning. */
export function isHermesPythonAgentConfigured(
  env: EnvSource = process.env,
): boolean {
  if (env.HERMES_USE_PYTHON_AGENT !== "true") {
    return false;
  }
  return (
    Boolean(resolveHermesAgentRoot(env)) &&
    hasGroqCredentialsForHermesAgent(env)
  );
}
