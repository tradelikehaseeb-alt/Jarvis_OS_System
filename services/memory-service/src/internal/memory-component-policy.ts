/**
 * Memory storage selection — SQLite native module vs in-memory Maps.
 */

/** Legacy memory stubs only when forced in test harness. */
export function useMemoryStubComponents(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return (
    env.NODE_ENV === "test" &&
    env.MEMORY_FORCE_STUB_COMPONENTS === "true"
  );
}

/** Electron and `JARVIS_MEMORY_BACKEND=local` must not load `better-sqlite3`. */
export function useInMemoryJarvisStorage(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  if (useMemoryStubComponents(env)) {
    return false;
  }
  if (process.versions.electron) {
    return true;
  }
  if (env.MEMORY_USE_IN_MEMORY_STORAGE === "true") {
    return true;
  }
  const backend = env.JARVIS_MEMORY_BACKEND?.trim().toLowerCase();
  return backend === "local";
}

/** Production SQLite — Node ABI only (not Electron / local backend). */
export function shouldUseSqliteJarvisStorage(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  if (useMemoryStubComponents(env)) {
    return false;
  }
  return !useInMemoryJarvisStorage(env);
}
