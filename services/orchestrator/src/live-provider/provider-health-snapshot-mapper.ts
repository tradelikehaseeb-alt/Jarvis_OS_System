import type { ProviderHealthSnapshot } from "@jarvis/types";

import type { ProviderHealthCheckResult } from "../llm-provider/provider-health/provider-health-check-result";

/** Map internal health probe result to shared snapshot type (Phase 85). */
export function toProviderHealthSnapshot(
  result: ProviderHealthCheckResult,
): ProviderHealthSnapshot {
  return { ...result };
}

/** Map health probe results to shared snapshots (Phase 85). */
export function toProviderHealthSnapshots(
  results: readonly ProviderHealthCheckResult[],
): readonly ProviderHealthSnapshot[] {
  return results.map(toProviderHealthSnapshot);
}
