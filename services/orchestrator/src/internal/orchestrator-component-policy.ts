/**
 * When true, orchestrator uses legacy Phase-4 stub components (unit tests only).
 */
export function useOrchestratorStubComponents(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return (
    env.NODE_ENV === "test" &&
    env.ORCHESTRATOR_FORCE_STUB_COMPONENTS === "true"
  );
}
