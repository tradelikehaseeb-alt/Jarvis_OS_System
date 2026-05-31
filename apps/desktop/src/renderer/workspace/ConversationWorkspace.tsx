import { useCallback, useMemo, useState } from "react";

import {
  extractHermesPlanFromTaskStatus,
  extractHermesPlanningDetails,
} from "../api/extract-hermes-plan";
import { formatAssistantReply } from "../api/format-assistant-reply";
import { submitChatAsTask } from "../api/jarvis-client";
import { AgentStatusPanel, useAgentStatus } from "../agent-status";
import { TaskProgressPanel } from "../timeline";
import { ChatInput } from "../components/ChatInput";
import { ChatMessages, type ChatMessage } from "../components/ChatMessages";
import { TaskPanel } from "../components/TaskPanel";
import { VoiceButton } from "../components/VoiceButton";
import { VoiceShell } from "../components/VoiceShell";
import { VoiceStatusIndicator } from "../components/VoiceStatusIndicator";
import { classifyChatIntent, loadingMessageForIntent } from "../intent";
import type { HermesPlanMessageData } from "../types/hermes-plan";
import {
  loadVoiceSettings,
  useMockVoiceInput,
  useVoiceExecution,
  type VoiceSettings,
} from "../voice";
import type { CreateTaskResponse, TaskStatusResponse } from "@jarvis/types";

import { useConversationWorkspace } from "./use-conversation-workspace";
import { WorkspaceSessionPanel } from "./WorkspaceSessionPanel";
import { WorkspaceSidebar } from "./WorkspaceSidebar";

let messageCounter = 0;

function nextMessageId(): string {
  messageCounter += 1;
  return `msg-${messageCounter}`;
}

function buildHermesPlanMessageData(
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

/**
 * Persistent conversation workspace with execution, memory, and context (Phase 76).
 */
export function ConversationWorkspace() {
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

      const hermesPlan = buildHermesPlanMessageData(result.status);
      const reply = hermesPlan ? "" : formatAssistantReply(result.status);

      setMessages((prev) => {
        const next = [
          ...prev.filter((m) => m.role !== "loading"),
          {
            id: nextMessageId(),
            role: "assistant" as const,
            text: reply,
            ...(hermesPlan ? { hermesPlan } : {}),
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
            text: loadingMessageForIntent(classifyChatIntent(normalized).intent),
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
        text: loadingMessageForIntent(classification.intent),
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

      const hermesPlan = buildHermesPlanMessageData(status);
      const reply = hermesPlan ? "" : formatAssistantReply(status);

      if (status.status === "failed" && !hermesPlan) {
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
            ...(hermesPlan ? { hermesPlan } : {}),
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

  const voiceComposerActions = useMemo(
    () => (
      <div className="chat-voice-actions" data-testid="chat-voice-actions">
        <VoiceButton
          status={voice.status}
          onPress={voice.toggleListening}
          disabled={loading}
        />
        <VoiceStatusIndicator status={voice.status} error={voice.error} />
      </div>
    ),
    [loading, voice.error, voice.status, voice.toggleListening],
  );

  return (
    <div className="conversation-workspace" data-testid="conversation-workspace">
      <WorkspaceSidebar
        sessions={workspace.sessions}
        activeSessionId={activeSession.sessionId}
        onSelect={workspace.selectWorkspaceSession}
        onCreate={workspace.createWorkspaceSession}
        onRestore={workspace.restoreWorkspaceSession}
      />

      <div className="chat-layout">
        <div className="chat-column">
          <ChatMessages messages={messages} />
          <VoiceShell
            voice={voice}
            settings={voiceSettings}
            disabled={loading}
            variant="chat"
          />
          {voiceNormalizerError ? (
            <p className="voice-normalization-error" role="alert">
              {voiceNormalizerError}
            </p>
          ) : null}
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={() => void handleSubmit()}
            loading={loading}
            leadingAction={voiceComposerActions}
          />
        </div>

        <div className="chat-sidebar">
          <WorkspaceSessionPanel session={activeSession} />
          <AgentStatusPanel
            status={agentStatus.status}
            events={agentStatus.events}
            loading={agentStatus.loading}
          />
          <TaskProgressPanel
            steps={timeline.steps}
            progress={timeline.progress}
            loading={timeline.isStreaming}
          />
          <TaskPanel
            loading={loading}
            create={createResult}
            status={statusResult}
            error={taskError}
          />
        </div>
      </div>
    </div>
  );
}
