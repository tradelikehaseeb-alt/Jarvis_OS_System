import { isHermesPythonAgentConfigured } from "./hermes-python-runtime-config";

/**
 * Environment-driven configuration for Hermes local runtime discovery (Phase 21).
 */

export type HermesRuntimeMode =
  | "stub"
  | "planning"
  | "local"
  | "official"
  | "cloud";

export interface HermesRuntimeEnv {
  readonly mode: HermesRuntimeMode;
  readonly endpoint: string;
  readonly configured: boolean;
}

/** Default local Hermes gateway when mode is `local` and endpoint is omitted. */
export const DEFAULT_HERMES_LOCAL_ENDPOINT = "http://127.0.0.1:8080";

export type EnvSource = Readonly<Record<string, string | undefined>>;

function parseMode(raw: string | undefined): HermesRuntimeMode {
  const value = (raw ?? "stub").trim().toLowerCase();
  if (
    value === "local" ||
    value === "official" ||
    value === "cloud" ||
    value === "stub" ||
    value === "planning"
  ) {
    return value;
  }
  return "stub";
}

/**
 * Read {@link HermesRuntimeEnv} from `HERMES_ENDPOINT` and `HERMES_MODE`.
 *
 * Official discovery is active when mode is `local` or `official` (not `stub` / `cloud`).
 */
export function readHermesRuntimeEnv(
  env: EnvSource = process.env,
): HermesRuntimeEnv {
  const mode = parseMode(env.HERMES_MODE);
  const explicitEndpoint = env.HERMES_ENDPOINT?.trim() ?? "";

  const endpoint =
    explicitEndpoint ||
    (mode === "local" || mode === "official"
      ? DEFAULT_HERMES_LOCAL_ENDPOINT
      : "");

  const configured =
    isHermesPythonAgentConfigured(env) ||
    ((mode === "local" || mode === "official") && endpoint.length > 0);

  return { mode, endpoint, configured };
}
