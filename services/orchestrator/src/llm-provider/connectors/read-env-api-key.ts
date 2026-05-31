/** Read the first configured API key environment variable (Phase 82). */
export function readEnvApiKey(
  envVars: readonly string[],
  env: Readonly<Record<string, string | undefined>> = process.env,
): string | undefined {
  for (const envVar of envVars) {
    const value = env[envVar];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
}
