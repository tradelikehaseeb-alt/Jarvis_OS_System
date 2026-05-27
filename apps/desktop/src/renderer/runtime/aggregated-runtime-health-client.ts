import type { AggregatedRuntimeHealthResponse } from "./aggregated-runtime-health-types";

function getBridge() {
  if (!window.jarvis?.getAggregatedRuntimeHealth) {
    throw new Error("Aggregated runtime health bridge unavailable");
  }
  return window.jarvis;
}

/**
 * Fetches aggregated runtime health from main process (Phase 74).
 */
export async function fetchAggregatedRuntimeHealth(): Promise<AggregatedRuntimeHealthResponse> {
  return getBridge().getAggregatedRuntimeHealth();
}

export async function fetchAggregatedRuntimeHealthSnapshot(): Promise<AggregatedRuntimeHealthResponse> {
  return getBridge().getAggregatedRuntimeHealthSnapshot();
}
