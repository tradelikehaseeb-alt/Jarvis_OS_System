import type { EnvSource } from "../../adapter/official/src/openclaw-runtime-env";

/**
 * Returns true when Playwright browser execution is requested (Phase 100A).
 */
export function isRealBrowserExecutionEnabled(
  env: EnvSource = process.env,
): boolean {
  const flag = env.JARVIS_BROWSER_REAL?.trim().toLowerCase();
  return flag === "true" || flag === "1";
}
