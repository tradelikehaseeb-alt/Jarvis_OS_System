import { useCallback, useRef, useState } from "react";
import {
  createDefaultVoiceExecutionRuntime,
  type VoiceExecutionResult,
  type VoiceExecutionRuntime,
} from "@jarvis/speech-service";
import type { TaskStatusResponse } from "@jarvis/types";

import type { UseActivityStreamResult } from "../activity";
import { submitChatAsTask } from "../api/jarvis-client";
import { classifyChatIntent } from "../intent";

export interface UseVoiceExecutionOptions {
  readonly activity: UseActivityStreamResult;
  readonly skipHealthCheck?: boolean;
  readonly onComplete?: (
    result: VoiceExecutionResult & { readonly status?: TaskStatusResponse },
  ) => void;
}

export interface UseVoiceExecutionResult {
  readonly executing: boolean;
  readonly lastResult: VoiceExecutionResult | null;
  readonly error: string | null;
  readonly startVoiceExecution: (rawInput: string) => string;
  readonly stopVoiceExecution: (executionId: string) => void;
  readonly processVoiceInput: (
    rawInput: string,
  ) => Promise<VoiceExecutionResult | null>;
}

/**
 * Desktop voice → speech → API → orchestrator execution hook (Phase 72).
 */
export function useVoiceExecution(
  options: UseVoiceExecutionOptions,
): UseVoiceExecutionResult {
  const [executing, setExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<VoiceExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const runtimeRef = useRef<VoiceExecutionRuntime>(
    createDefaultVoiceExecutionRuntime({
      taskExecutor: async (input) => {
        const classification = classifyChatIntent(input.normalizedText);
        const { create, status } = await submitChatAsTask(input.normalizedText, {
          classification,
          skipHealthCheck: options.skipHealthCheck,
        });

        if (status.status === "failed") {
          return {
            taskId: create.taskId,
            taskStatus: status,
            classification: {
              intent: classification.intent,
              ruleId: classification.ruleId,
              confidence: classification.confidence,
              reason: classification.reason,
            },
            activityStream: status.output?.activityStream,
            error: {
              code: status.error?.code ?? "TASK_FAILED",
              message: status.error?.message ?? "Voice task execution failed",
            },
          };
        }

        return {
          taskId: create.taskId,
          taskStatus: status,
          classification: {
            intent: classification.intent,
            ruleId: classification.ruleId,
            confidence: classification.confidence,
            reason: classification.reason,
          },
          activityStream: status.output?.activityStream,
        };
      },
    }),
  );

  const startVoiceExecution = useCallback((rawInput: string) => {
    const requestId = `voice-req-${Date.now()}`;
    return runtimeRef.current.startVoiceExecution({
      requestId,
      rawInput,
    });
  }, []);

  const stopVoiceExecution = useCallback((executionId: string) => {
    runtimeRef.current.stopVoiceExecution(executionId);
    setExecuting(false);
  }, []);

  const processVoiceInput = useCallback(
    async (rawInput: string): Promise<VoiceExecutionResult | null> => {
      const trimmed = rawInput.trim();
      if (!trimmed) {
        return null;
      }

      setExecuting(true);
      setError(null);

      const requestId = `voice-req-${Date.now()}`;
      const executionId = runtimeRef.current.startVoiceExecution({
        requestId,
        rawInput: trimmed,
      });

      const classification = classifyChatIntent(trimmed);
      options.activity.startStream(classification.intent);

      try {
        const result = await runtimeRef.current.processVoiceInput({
          requestId,
          rawInput: trimmed,
          executionId,
          metadata: { source: "desktop-voice" },
        });

        setLastResult(result);

        const status = result.taskStatus as TaskStatusResponse | undefined;
        if (status) {
          options.activity.ingestTaskStatus(status);
        } else if (!result.success) {
          options.activity.reportError(
            result.error?.message ?? "Voice execution failed",
          );
        }

        if (!result.success) {
          setError(result.error?.message ?? "Voice execution failed");
        }

        options.onComplete?.({
          ...result,
          status,
        });

        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Voice execution failed";
        setError(message);
        options.activity.reportError(message);
        return null;
      } finally {
        setExecuting(false);
      }
    },
    [options],
  );

  return {
    executing,
    lastResult,
    error,
    startVoiceExecution,
    stopVoiceExecution,
    processVoiceInput,
  };
}
