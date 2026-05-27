import { useCallback, useState } from "react";

import type { ProviderHealthSnapshot, ProviderTelemetry } from "@jarvis/types";
import type {
  JarvisUserSession,
  JarvisUserSessionPromptResult,
  JarvisUserSessionReport,
} from "@jarvis/orchestrator";

import { getJarvisUserSessionRuntime } from "./jarvis-user-session-client";

export interface UseJarvisUserSessionResult {
  readonly session: JarvisUserSession | null;
  readonly report: JarvisUserSessionReport | null;
  readonly lastResult: JarvisUserSessionPromptResult | null;
  readonly providerHealth: readonly ProviderHealthSnapshot[];
  readonly telemetry: readonly ProviderTelemetry[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly startSession: (conversationId?: string) => Promise<JarvisUserSession>;
  readonly runSession: () => Promise<JarvisUserSessionReport>;
  readonly executePrompt: (prompt: string) => Promise<JarvisUserSessionPromptResult>;
}

/** Desktop hook for real Jarvis user sessions (Phase 86). */
export function useJarvisUserSession(): UseJarvisUserSessionResult {
  const [session, setSession] = useState<JarvisUserSession | null>(null);
  const [report, setReport] = useState<JarvisUserSessionReport | null>(null);
  const [lastResult, setLastResult] = useState<JarvisUserSessionPromptResult | null>(null);
  const [providerHealth, setProviderHealth] = useState<readonly ProviderHealthSnapshot[]>([]);
  const [telemetry, setTelemetry] = useState<readonly ProviderTelemetry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startSession = useCallback(async (conversationId?: string) => {
    setError(null);
    const runtime = await getJarvisUserSessionRuntime();
    const next = await runtime.startUserSession({
      userId: "desktop-user",
      conversationId,
    });
    setSession(next);
    setProviderHealth(next.providerHealth);
    setReport(null);
    setLastResult(null);
    setTelemetry([]);
    return next;
  }, []);

  const executePrompt = useCallback(async (prompt: string) => {
    setLoading(true);
    setError(null);

    try {
      const runtime = await getJarvisUserSessionRuntime();
      const result = await runtime.executeUserPrompt({
        prompt,
        userId: "desktop-user",
        conversationId: session?.conversationId,
      });

      setLastResult(result);
      setTelemetry(runtime.captureSessionTelemetry());
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "User session prompt failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session?.conversationId]);

  const runSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const runtime = await getJarvisUserSessionRuntime();
      const nextReport = await runtime.runUserSession({
        userId: "desktop-user",
        conversationId: session?.conversationId,
      });

      setReport(nextReport);
      setSession(nextReport.session);
      setProviderHealth(nextReport.session.providerHealth);
      setTelemetry(nextReport.telemetry);
      return nextReport;
    } catch (err) {
      const message = err instanceof Error ? err.message : "User session failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session?.conversationId]);

  return {
    session,
    report,
    lastResult,
    providerHealth,
    telemetry,
    loading,
    error,
    startSession,
    runSession,
    executePrompt,
  };
}
