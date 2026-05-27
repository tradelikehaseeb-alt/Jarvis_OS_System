import { useCallback, useState } from "react";

import type {
  LiveExecutionResult,
  LiveExecutionSession,
  LiveExecutionTelemetry,
  LiveExecutionUpdate,
} from "./live-execution-types";
import { getLiveExecutionRuntime } from "./live-execution-client";

export interface UseLiveExecutionResult {
  readonly session: LiveExecutionSession | null;
  readonly result: LiveExecutionResult | null;
  readonly updates: readonly LiveExecutionUpdate[];
  readonly telemetry: LiveExecutionTelemetry | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly startSession: (conversationId?: string) => Promise<LiveExecutionSession>;
  readonly executeCommand: (command: string) => Promise<LiveExecutionResult>;
}

/** Desktop hook for live execution sessions (Phase 84). */
export function useLiveExecution(): UseLiveExecutionResult {
  const [session, setSession] = useState<LiveExecutionSession | null>(null);
  const [result, setResult] = useState<LiveExecutionResult | null>(null);
  const [updates, setUpdates] = useState<LiveExecutionUpdate[]>([]);
  const [telemetry, setTelemetry] = useState<LiveExecutionTelemetry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startSession = useCallback(async (conversationId?: string) => {
    setError(null);
    const runtime = await getLiveExecutionRuntime();
    const next = runtime.startLiveExecution({
      userId: "desktop-user",
      conversationId,
    });
    setSession(next);
    setUpdates([]);
    setResult(null);
    setTelemetry(null);
    return next;
  }, []);

  const executeCommand = useCallback(
    async (command: string) => {
      if (!session) {
        throw new Error("Live execution session not started");
      }

      setLoading(true);
      setError(null);

      try {
        const runtime = await getLiveExecutionRuntime();
        runtime.streamLiveUpdates(session.sessionId, {
          subscriberId: "desktop-live-exec",
          onUpdate: (update) => {
            setUpdates((prev) => [...prev, update]);
          },
        });

        const nextResult = await runtime.executeLiveTask({
          sessionId: session.sessionId,
          command,
        });

        setResult(nextResult);
        setTelemetry(runtime.captureTelemetry(session.sessionId));
        setSession(nextResult.session);
        return nextResult;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Live execution failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [session],
  );

  return {
    session,
    result,
    updates,
    telemetry,
    loading,
    error,
    startSession,
    executeCommand,
  };
}
