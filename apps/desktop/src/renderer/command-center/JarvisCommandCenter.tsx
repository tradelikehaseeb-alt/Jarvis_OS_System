import { useMemo } from "react";

import { ChatMessages } from "../components/ChatMessages";
import { VoiceButton } from "../components/VoiceButton";
import { VoiceShell } from "../components/VoiceShell";
import { VoiceStatusIndicator } from "../components/VoiceStatusIndicator";
import { WorkspaceSidebar } from "../workspace/WorkspaceSidebar";
import {
  LiveSpeechOrb,
  StreamingVoiceOverlay,
  VoiceInterruptController,
} from "../voice-native";

import { AIStatusOrb } from "./AIStatusOrb";
import { FloatingCommandInput } from "./FloatingCommandInput";
import { JARVIS_EXECUTION_LABELS } from "./execution-display-labels";
import { LiveExecutionPanel } from "./LiveExecutionPanel";
import { useJarvisConversation } from "./use-jarvis-conversation";

/**
 * Futuristic Jarvis command center — voice-native primary surface (Phase 89 / 90).
 */
export function JarvisCommandCenter() {
  const conversation = useJarvisConversation();
  const {
    workspace,
    activeSession,
    timeline,
    messages,
    input,
    setInput,
    loading,
    taskError,
    voiceSettings,
    voiceNormalizerError,
    agentStatus,
    voice,
    voiceSession,
    handleSubmit,
    orbState,
    providerTelemetry,
  } = conversation;

  const voiceNative = voiceSettings.voiceNativeUi;

  const voiceComposerActions = useMemo(
    () => (
      <div className="chat-voice-actions" data-testid="chat-voice-actions">
        <VoiceButton
          status={voice.status}
          onPress={voice.toggleListening}
          disabled={loading}
        />
        {!voiceNative ? (
          <VoiceStatusIndicator status={voice.status} error={voice.error} />
        ) : null}
      </div>
    ),
    [loading, voice.error, voice.status, voice.toggleListening, voiceNative],
  );

  const showVoiceOverlay =
    voiceNative &&
    (voiceSession.isActive ||
      voiceSession.isSpeaking ||
      voiceSession.partialTranscript.length > 0 ||
      voiceSession.streamingResponse.length > 0);

  return (
    <div
      className={`jarvis-command-center${voiceNative ? " jarvis-command-center--voice-native" : ""}`}
      data-testid="jarvis-command-center"
    >
      <WorkspaceSidebar
        sessions={workspace.sessions}
        activeSessionId={activeSession.sessionId}
        onSelect={workspace.selectWorkspaceSession}
        onCreate={workspace.createWorkspaceSession}
        onRestore={workspace.restoreWorkspaceSession}
      />

      <div className="command-center-main">
        <header
          className={`command-center-header${voiceNative ? " command-center-header--voice-native" : ""}`}
        >
          {voiceNative ? (
            <LiveSpeechOrb
              state={voiceSession.sessionState}
              partialTranscript={voiceSession.partialTranscript}
              active={voiceSession.isActive || voiceSession.isSpeaking}
              micLevels={voiceSession.micLevels}
              confidence={voiceSession.transcriptConfidence}
              latencyMs={voiceSession.sttLatencyMs}
            />
          ) : (
            <AIStatusOrb
              state={orbState}
              label={agentStatus.status.displayMessage}
              providerLabel={providerTelemetry?.label}
              latencyMs={providerTelemetry?.latencyMs}
            />
          )}
          <VoiceInterruptController
            visible={voiceSession.isSpeaking}
            onInterrupt={voiceSession.interruptSpeaking}
          />
        </header>

        <div
          className={`command-center-body${voiceNative ? " command-center-body--voice-native" : ""}`}
        >
          <div className="command-center-transcript">
            {showVoiceOverlay ? (
              <StreamingVoiceOverlay
                visible
                streamingText={voiceSession.streamingResponse}
                partialTranscript={voiceSession.partialTranscript}
                confidence={voiceSession.transcriptConfidence}
                latencyMs={voiceSession.sttLatencyMs}
              />
            ) : null}
            <ChatMessages messages={messages} />
            {!voiceNative ? (
              <VoiceShell
                voice={voice}
                settings={voiceSettings}
                disabled={loading}
                variant="chat"
              />
            ) : null}
            {voiceNormalizerError ? (
              <p className="voice-normalization-error" role="alert">
                {voiceNormalizerError}
              </p>
            ) : null}
          </div>

          {!voiceNative ? (
            <aside className="command-center-rail">
              <LiveExecutionPanel
                steps={timeline.steps}
                progress={timeline.progress}
                events={timeline.events}
                loading={timeline.isStreaming || loading}
                displayMessage={agentStatus.status.displayMessage}
                error={taskError ?? agentStatus.status.error}
                providerLabel={providerTelemetry?.label}
                latencyMs={providerTelemetry?.latencyMs}
              />
            </aside>
          ) : null}
        </div>

        <FloatingCommandInput
          value={input}
          onChange={setInput}
          onSubmit={() => void handleSubmit()}
          loading={loading}
          placeholder={JARVIS_EXECUTION_LABELS.sendPrompt}
          leadingAction={voiceComposerActions}
        />
      </div>
    </div>
  );
}
