/**
 * Legacy memory stubs only when forced in test harness.
 */
export function useMemoryStubComponents(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return (
    env.NODE_ENV === "test" &&
    env.MEMORY_FORCE_STUB_COMPONENTS === "true"
  );
}
