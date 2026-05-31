/**
 * Environment-driven configuration for OpenClaw local runtime discovery (Phase 21).
 */

export type OpenClawRuntimeMode = "stub" | "local" | "official" | "remote";

export interface OpenClawRuntimeEnv {
  readonly mode: OpenClawRuntimeMode;
  readonly endpoint: string;
  readonly configured: boolean;
}

/** Default local OpenClaw gateway when mode is `local` and endpoint is omitted. */
export const DEFAULT_OPENCLAW_LOCAL_ENDPOINT = "http://127.0.0.1:18789";

export type EnvSource = Readonly<Record<string, string | undefined>>;

function parseMode(raw: string | undefined): OpenClawRuntimeMode {
  const value = (raw ?? "stub").trim().toLowerCase();
  if (
    value === "local" ||
    value === "official" ||
    value === "remote" ||
    value === "stub"
  ) {
    return value;
  }
  return "stub";
}

/**
 * Read {@link OpenClawRuntimeEnv} from `OPENCLAW_ENDPOINT` and `OPENCLAW_MODE`.
 */
export function readOpenClawRuntimeEnv(
  env: EnvSource = process.env,
): OpenClawRuntimeEnv {
  const mode = parseMode(env.OPENCLAW_MODE);
  const explicitEndpoint =
    env.OPENCLAW_ENDPOINT?.trim() ||
    env.OPENCLAW_GATEWAY_URL?.trim() ||
    "";

  const endpoint =
    explicitEndpoint ||
    (mode === "local" || mode === "official"
      ? DEFAULT_OPENCLAW_LOCAL_ENDPOINT
      : "");

  const configured =
    (mode === "local" || mode === "official") && endpoint.length > 0;

  return { mode, endpoint, configured };
}
