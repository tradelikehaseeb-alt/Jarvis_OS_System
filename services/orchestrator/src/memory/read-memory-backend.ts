export type JarvisMemoryBackend = "memory-service" | "local";

/**
 * Selects orchestrator memory persistence backend (integration phase).
 */
export function readMemoryBackend(
  env: Readonly<Record<string, string | undefined>> = process.env,
): JarvisMemoryBackend {
  const raw = env.JARVIS_MEMORY_BACKEND?.trim().toLowerCase();
  return raw === "local" ? "local" : "memory-service";
}
