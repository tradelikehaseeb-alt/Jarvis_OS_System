import type { RuntimeHealthSnapshot } from "./runtime-health-snapshot";

function getBridge() {
  if (!window.jarvis?.getRuntimeHealth) {
    throw new Error("Runtime health bridge unavailable");
  }
  return window.jarvis;
}

/**
 * Fetches runtime process health from main-process manager (Phase 56).
 */
export async function fetchRuntimeHealth(): Promise<RuntimeHealthSnapshot> {
  return getBridge().getRuntimeHealth();
}
