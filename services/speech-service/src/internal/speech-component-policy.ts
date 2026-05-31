/**
 * Legacy speech stubs only when forced in test harness.
 */
export function useSpeechStubComponents(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return (
    env.NODE_ENV === "test" &&
    env.SPEECH_FORCE_STUB_COMPONENTS === "true"
  );
}
