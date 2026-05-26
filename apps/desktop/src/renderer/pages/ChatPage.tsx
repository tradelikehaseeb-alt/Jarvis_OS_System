import { useCallback, useMemo, useState } from "react";

import {
  extractHermesPlanFromTaskStatus,
  extractHermesPlanningDetails,
} from "../api/extract-hermes-plan";
import { submitChatAsTask } from "../api/jarvis-client";
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
  type VoiceSettings,
} from "../voice";
import type { CreateTaskResponse, TaskStatusResponse } from "@jarvis/types";

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
    return `Task completed. Search results: ${titles}`;
  }

  if (status.output?.routing) {
    const agent = (status.output.routing as { selectedAgentId?: string })
      .selectedAgentId;
    return `Task ${status.status}. Routed to ${agent ?? "agent"}.`;
  }

  return `Task ${status.status}.`;
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
 * Chat page — voice shell → classify intent → POST /tasks (Phase 18–25).
 */
export function ChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [createResult, setCreateResult] = useState<CreateTaskResponse | null>(
    null,
  );
  const [statusResult, setStatusResult] = useState<TaskStatusResponse | null>(
    null,
  );
  const [taskError, setTaskError] = useState<string | null>(null);
  const [voiceSettings] = useState<VoiceSettings>(() => loadVoiceSettings());
  const [voiceNormalizerError, setVoiceNormalizerError] = useState<string | null>(
    null,
  );

  const voice = useMockVoiceInput({
    settings: voiceSettings,
    onTranscriptReady: (normalized) => {
      setVoiceNormalizerError(null);
      setInput(normalized);
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

    try {
      const { create, status } = await submitChatAsTask(text, {
        classification,
      });
      setCreateResult(create);
      setStatusResult(status);

      const hermesPlan = buildHermesPlanMessageData(status);
      const reply = hermesPlan ? "" : formatAssistantReply(status);

      if (status.status === "failed" && !hermesPlan) {
        throw new Error(
          status.error?.message ?? "Task failed without a planning result",
        );
      }

      setMessages((prev) => [
        ...prev.filter((m) => m.role !== "loading"),
        {
          id: nextMessageId(),
          role: "assistant",
          text: reply,
          ...(hermesPlan ? { hermesPlan } : {}),
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed";
      setTaskError(message);
      setMessages((prev) => [
        ...prev.filter((m) => m.role !== "loading"),
        { id: nextMessageId(), role: "error", text: message },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, voice]);

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
      <TaskPanel
        loading={loading}
        create={createResult}
        status={statusResult}
        error={taskError}
      />
    </div>
  );
}
