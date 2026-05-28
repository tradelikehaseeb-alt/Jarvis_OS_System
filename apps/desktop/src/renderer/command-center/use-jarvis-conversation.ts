import { useCallback, useMemo, useState } from "react";

import {
  extractHermesPlanFromTaskStatus,
  extractHermesPlanningDetails,
} from "../api/extract-hermes-plan";
import { submitChatAsTask } from "../api/jarvis-client";
import { useAgentStatus } from "../agent-status";
import { classifyChatIntent } from "../intent";
import type { HermesPlanMessageData } from "../types/hermes-plan";
import {
  loadVoiceSettings,
  useMockVoiceInput,
  useVoiceExecution,
  type VoiceSettings,
} from "../voice";
import type { CreateTaskResponse, TaskStatusResponse } from "@jarvis/types";

import { useConversationWorkspace } from "../workspace/use-conversation-workspace";
import { loadingMessageForJarvisIntent } from "./execution-display-labels";
import type { ChatMessage } from "../components/ChatMessages";

let messageCounter = 0;

function nextMessageId(): string {
  messageCounter += 1;
  return `msg-${messageCounter}`;
}

function formatAssistantReply(status: TaskStatusResponse): string {
  const skill = status.output?.skill as
    | { skillId?: string; data?: { results?: { title: string }[] } }
    | undefined;

  if (skill?.skillId === "search-skill" && skill.data?.results?.length) {
    const titles = skill.data.results.map((r) => r.title).join(", ");
    return `Done. Results: ${titles}`;
  }

  if (status.output?.routing) {
    return status.status === "completed" ? "Complete." : `Status: ${status.status}.`;
  }

  return status.status === "completed" ? "Complete." : `Status: ${status.status}.`;
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

  const handleVoiceExecutionComplete = useCallback(
    (result: {
      status?: TaskStatusResponse;
      normalizedInput: string;
      success: boolean;
    }) => {
      if (!result.status) {
        return;
      }

      setCreateResult({
        taskId: result.status.taskId,
        status: result.status.status,
        createdAt: result.status.updatedAt,
      });

      const plan = buildPlanMessageData(result.status);
      const reply = plan ? "" : formatAssistantReply(result.status);

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
        applyTaskResult(result.status!, next);
        return next;
      });
    },
    [applyTaskResult],
  );

  const voiceExecution = useVoiceExecution({
    activity: timeline,
    onComplete: (result) => {
      if (result.status) {
        handleVoiceExecutionComplete(result);
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

  const voice = useMockVoiceInput({
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
    disabled: loading,
  });

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
  }, [agentStatus.status, loading, taskError, timeline.isStreaming]);

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
    handleSubmit,
    orbState,
    providerTelemetry,
  };
}
