import { useCallback, useMemo, useState } from "react";

import {
  extractHermesPlanFromTaskStatus,
  extractHermesPlanningDetails,
} from "../api/extract-hermes-plan";
import { formatAssistantReply } from "../api/format-assistant-reply";
import { submitChatAsTask } from "../api/jarvis-client";
import { useAgentStatus } from "../agent-status";
import { classifyChatIntent } from "../intent";
import type { HermesPlanMessageData } from "../types/hermes-plan";
import {
  loadVoiceSettings,
  useAdaptiveVoiceInput,
  useVoiceExecution,
  type VoiceSettings,
} from "../voice";
import { useVoiceSession } from "../voice-native";
import type { CreateTaskResponse, TaskStatusResponse } from "@jarvis/types";

import { useConversationWorkspace } from "../workspace/use-conversation-workspace";
import { loadingMessageForJarvisIntent } from "./execution-display-labels";
import type { ChatMessage } from "../components/ChatMessages";
import { parseMemoryRecallView } from "../memory/memory-recall-view";

let messageCounter = 0;

function nextMessageId(): string {
  messageCounter += 1;
  return `msg-${messageCounter}`;
}

function buildPlanMessageData(
  status: TaskStatusResponse,
): HermesPlanMessageData | undefined {
  const plan = extractHermesPlanFromTaskStatus(status);
  if (!plan) {
    return undefined;
  }
  return {
    plan,
    details: extractHermesPlanningDetails(status),
  };
}

/** Shared conversation + execution state for command center (Phase 89). */
export function useJarvisConversation() {
  const workspace = useConversationWorkspace();
  const { timeline, activeSession } = workspace;

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [createResult, setCreateResult] = useState<CreateTaskResponse | null>(null);
  const [statusResult, setStatusResult] = useState<TaskStatusResponse | null>(null);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [voiceSettings] = useState<VoiceSettings>(() => loadVoiceSettings());
  const [voiceNormalizerError, setVoiceNormalizerError] = useState<string | null>(
    null,
  );

  const agentStatus = useAgentStatus({
    events: timeline.events,
    isStreaming: timeline.isStreaming,
  });

  const applyTaskResult = useCallback(
    (status: TaskStatusResponse, nextMessages: ChatMessage[]) => {
      setStatusResult(status);
      workspace.syncWorkspaceFromTask(status, nextMessages);
    },
    [workspace],
  );

  const handleVoiceTaskComplete = useCallback(
    (status: TaskStatusResponse, normalized: string) => {
      setCreateResult({
        taskId: status.taskId,
        status: status.status,
        createdAt: status.updatedAt,
      });

      const plan = buildPlanMessageData(status);
      const reply = plan ? "" : formatAssistantReply(status);

      setMessages((prev) => {
        const next = [
          ...prev.filter((m) => m.role !== "loading"),
          {
            id: nextMessageId(),
            role: "assistant" as const,
            text: reply,
            ...(plan ? { hermesPlan: plan } : {}),
          },
        ];
        applyTaskResult(status, next);
        return next;
      });
    },
    [applyTaskResult],
  );

  const voiceSession = useVoiceSession({
    settings: voiceSettings,
    activity: timeline,
    disabled: loading,
    onTranscriptReady: (normalized) => {
      setVoiceNormalizerError(null);
      setInput(normalized);
    },
    onCommandRecognized: (normalized) => {
      if (!voiceSettings.autoExecuteVoicePipeline) {
        return;
      }
      setMessages((prev) => [
        ...prev,
        {
          id: nextMessageId(),
          role: "user",
          text: normalized,
          detectedIntent: classifyChatIntent(normalized).intent,
        },
        {
          id: nextMessageId(),
          role: "loading",
          text: loadingMessageForJarvisIntent(classifyChatIntent(normalized).intent),
        },
      ]);
      setLoading(true);
    },
    onExecutionComplete: (status) => {
      handleVoiceTaskComplete(status, "");
      setLoading(false);
    },
    onError: (message) => {
      setTaskError(message);
      setLoading(false);
      setMessages((prev) => [
        ...prev.filter((m) => m.role !== "loading"),
        { id: nextMessageId(), role: "error", text: message },
      ]);
    },
  });

  const voiceExecution = useVoiceExecution({
    activity: timeline,
    onComplete: (result) => {
      if (result.status) {
        handleVoiceTaskComplete(result.status, result.normalizedInput);
        return;
      }
      if (!result.success) {
        const message = result.error?.message ?? "Voice execution failed";
        setTaskError(message);
        setMessages((prev) => [
          ...prev.filter((m) => m.role !== "loading"),
          { id: nextMessageId(), role: "error", text: message },
        ]);
      }
    },
  });

  const legacyVoice = useAdaptiveVoiceInput({
    settings: voiceSettings,
    onTranscriptReady: (normalized) => {
      setVoiceNormalizerError(null);
      setInput(normalized);
      if (voiceSettings.autoExecuteVoicePipeline) {
        setMessages((prev) => [
          ...prev,
          {
            id: nextMessageId(),
            role: "user",
            text: normalized,
            detectedIntent: classifyChatIntent(normalized).intent,
          },
          {
            id: nextMessageId(),
            role: "loading",
            text: loadingMessageForJarvisIntent(classifyChatIntent(normalized).intent),
          },
        ]);
        setLoading(true);
        void voiceExecution.processVoiceInput(normalized).finally(() => {
          setLoading(false);
        });
      }
    },
    onNormalizationReady: (view) => {
      if (voiceSettings.enableNormalization && view.normalized.trim().length === 0) {
        setVoiceNormalizerError("Normalization produced an empty transcript");
      } else {
        setVoiceNormalizerError(null);
      }
    },
    disabled: loading || voiceSettings.voiceNativeUi,
  });

  const voice = voiceSettings.voiceNativeUi
    ? {
        status: voiceSession.status,
        transcript: voiceSession.transcript,
        normalization: null,
        metadata: null,
        error: voiceSession.error,
        isActive: voiceSession.isActive,
        toggleListening: voiceSession.toggleListening,
        cancel: voiceSession.cancel,
        clearTranscript: voiceSession.clearTranscript,
      }
    : legacyVoice;

  const handleSubmit = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) {
      return;
    }

    const classification = classifyChatIntent(text);

    setInput("");
    setTaskError(null);
    voice.clearTranscript();
    setMessages((prev) => [
      ...prev,
      {
        id: nextMessageId(),
        role: "user",
        text,
        detectedIntent: classification.intent,
      },
      {
        id: nextMessageId(),
        role: "loading",
        text: loadingMessageForJarvisIntent(classification.intent),
      },
    ]);
    setLoading(true);
    timeline.startStream(classification.intent);

    try {
      const { create, status } = await submitChatAsTask(text, {
        classification,
      });
      setCreateResult(create);
      timeline.ingestTaskStatus(status);

      const plan = buildPlanMessageData(status);
      const reply = plan ? "" : formatAssistantReply(status);

      if (status.status === "failed" && !plan) {
        throw new Error(
          status.error?.message ?? "Task failed without a planning result",
        );
      }

      setMessages((prev) => {
        const next = [
          ...prev.filter((m) => m.role !== "loading"),
          {
            id: nextMessageId(),
            role: "assistant" as const,
            text: reply,
            ...(plan ? { hermesPlan: plan } : {}),
          },
        ];
        applyTaskResult(status, next);
        return next;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed";
      setTaskError(message);
      timeline.reportError(message);
      setMessages((prev) => [
        ...prev.filter((m) => m.role !== "loading"),
        { id: nextMessageId(), role: "error", text: message },
      ]);
    } finally {
      setLoading(false);
    }
  }, [applyTaskResult, input, loading, timeline, voice]);

  const orbState = useMemo(() => {
    if (voiceSettings.voiceNativeUi && voiceSession.sessionState !== "idle") {
      if (voiceSession.sessionState === "error") {
        return "error" as const;
      }
      if (voiceSession.sessionState === "executing") {
        return "executing" as const;
      }
      if (
        voiceSession.sessionState === "thinking" ||
        voiceSession.sessionState === "speaking"
      ) {
        return "streaming" as const;
      }
      if (voiceSession.sessionState === "listening") {
        return "streaming" as const;
      }
    }
    if (taskError) {
      return "error" as const;
    }
    if (loading || timeline.isStreaming) {
      return agentStatus.status.openClaw === "executing" ? "executing" as const : "streaming" as const;
    }
    if (agentStatus.status.hermes === "completed" || agentStatus.status.openClaw === "completed") {
      return "complete" as const;
    }
    return "idle" as const;
  }, [
    agentStatus.status,
    loading,
    taskError,
    timeline.isStreaming,
    voiceSession.sessionState,
    voiceSettings.voiceNativeUi,
  ]);

  const providerTelemetry = useMemo(() => {
    const llm = statusResult?.output?.llmProvider as
      | { providerId?: string; stub?: boolean; latencyMs?: number }
      | undefined;
    if (!llm?.providerId) {
      return undefined;
    }
    return {
      label: llm.stub ? `${llm.providerId} (offline)` : llm.providerId,
      latencyMs: llm.latencyMs,
    };
  }, [statusResult]);

  const memoryRecallView = useMemo(
    () => parseMemoryRecallView(statusResult?.output as Record<string, unknown> | undefined),
    [statusResult],
  );

  return {
    workspace,
    activeSession,
    timeline,
    messages,
    input,
    setInput,
    loading,
    createResult,
    statusResult,
    taskError,
    voiceSettings,
    voiceNormalizerError,
    agentStatus,
    voice,
    voiceSession,
    handleSubmit,
    orbState,
    providerTelemetry,
    memoryRecallView,
  };
}
