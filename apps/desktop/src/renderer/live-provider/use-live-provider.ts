import { useCallback, useState } from "react";

import type { ProviderHealthSnapshot, ProviderTelemetry } from "@jarvis/types";
import type { LiveProviderPromptResult } from "@jarvis/orchestrator";

import { getLiveProviderRuntime } from "./live-provider-client";

export interface UseLiveProviderResult {
  readonly health: readonly ProviderHealthSnapshot[];
  readonly lastResult: LiveProviderPromptResult | null;
  readonly telemetry: ProviderTelemetry | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly refreshHealth: () => Promise<readonly ProviderHealthSnapshot[]>;
  readonly executePrompt: (prompt: string) => Promise<LiveProviderPromptResult>;
}

/** Desktop hook for live provider validation (Phase 85). */
export function useLiveProvider(): UseLiveProviderResult {
  const [health, setHealth] = useState<readonly ProviderHealthSnapshot[]>([]);
  const [lastResult, setLastResult] = useState<LiveProviderPromptResult | null>(null);
  const [telemetry, setTelemetry] = useState<ProviderTelemetry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshHealth = useCallback(async () => {
    setError(null);
    const runtime = await getLiveProviderRuntime();
    const snapshots = await runtime.getProviderHealth("desktop-user");
    setHealth(snapshots);
    return snapshots;
  }, []);

  const executePrompt = useCallback(async (prompt: string) => {
    setLoading(true);
    setError(null);

    try {
      const runtime = await getLiveProviderRuntime();
      const result = await runtime.executeLivePrompt({
        prompt,
        userId: "desktop-user",
      });

      setLastResult(result);
      setTelemetry(result.telemetry);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Live provider execution failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    health,
    lastResult,
    telemetry,
    loading,
    error,
    refreshHealth,
    executePrompt,
  };
}
