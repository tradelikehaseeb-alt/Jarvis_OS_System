export function readEnvApiKey(envVars: readonly string[]): string | undefined {
  for (const key of envVars) {
    const value = process.env[key]?.trim();
    if (value) {
      return value;
    }
  }
  return undefined;
}
