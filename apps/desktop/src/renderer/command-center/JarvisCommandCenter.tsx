import { useMemo } from "react";

import { ChatMessages } from "../components/ChatMessages";
import { VoiceButton } from "../components/VoiceButton";
import { VoiceShell } from "../components/VoiceShell";
import { VoiceStatusIndicator } from "../components/VoiceStatusIndicator";
import { WorkspaceSidebar } from "../workspace/WorkspaceSidebar";

import { AIStatusOrb } from "./AIStatusOrb";
import { FloatingCommandInput } from "./FloatingCommandInput";
import { JARVIS_EXECUTION_LABELS } from "./execution-display-labels";
import { LiveExecutionPanel } from "./LiveExecutionPanel";
import { useJarvisConversation } from "./use-jarvis-conversation";

/**
 * Futuristic Jarvis command center — primary user surface (Phase 89).
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
    handleSubmit,
    orbState,
    providerTelemetry,
  } = conversation;

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
    <div
      className="jarvis-command-center"
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
        <header className="command-center-header">
          <AIStatusOrb
            state={orbState}
            label={agentStatus.status.displayMessage}
            providerLabel={providerTelemetry?.label}
            latencyMs={providerTelemetry?.latencyMs}
          />
        </header>

        <div className="command-center-body">
          <div className="command-center-transcript">
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
          </div>

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
