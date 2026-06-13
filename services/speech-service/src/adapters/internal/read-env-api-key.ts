export function readEnvApiKey(
  envVars: readonly string[],
  env: Readonly<Record<string, string | undefined>> = process.env,
): string | undefined {
  for (const key of envVars) {
    const value = env[key]?.trim();
    if (value) {
      return value;
    }
  }
  return undefined;
}
