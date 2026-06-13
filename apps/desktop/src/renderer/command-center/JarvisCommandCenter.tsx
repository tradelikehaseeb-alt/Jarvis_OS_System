import { useMemo } from "react";

import { useSpeechConnection } from "../voice/use-speech-connection";

import { ChatPanel } from "./chat-panel";
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
import { JarvisHudStrip } from "./JarvisHudStrip";
import { FloatingCommandInput } from "./FloatingCommandInput";
import { PipelineTelemetryPanel } from "./PipelineTelemetryPanel";
import { buildPipelineTelemetryView } from "./command-center-telemetry";
import { JARVIS_EXECUTION_LABELS } from "./execution-display-labels";
import { LiveExecutionPanel } from "./LiveExecutionPanel";
import { useJarvisConversation } from "./use-jarvis-conversation";
import { ReconnectIndicator } from "../hardening/ReconnectIndicator";
import { useExecutionRuntime } from "../execution";
import { useWorkforceActivity } from "../workforce";
import { useProductivitySession } from "../productivity";
import { useContinuousPresence } from "../continuous";
import { useRealWorldExecution } from "../real-world";

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
    dismissThinking,
    orbState,
    providerTelemetry,
    memoryRecallView,
    statusResult,
  } = conversation;

  const runtimeDegraded =
    (statusResult?.output?.stability as { degraded?: boolean } | undefined)?.degraded ===
    true;
  const reconnectVisible =
    (loading || timeline.isStreaming) &&
    (Boolean(taskError) ||
      providerTelemetry?.label?.includes("offline") ||
      runtimeDegraded);
  const reconnectMessage =
    (statusResult?.output?.stability as { message?: string } | undefined)?.message ??
    (taskError ? "Working on your request…" : undefined);

  const executionRuntimeState = useExecutionRuntime({
    taskOutput: statusResult?.output,
  });

  const workforceActivity = useWorkforceActivity({
    taskOutput: statusResult?.output,
    loading: timeline.isStreaming || loading,
  });

  const productivitySession = useProductivitySession({
    taskOutput: statusResult?.output,
    loading: timeline.isStreaming || loading,
  });

  const continuousPresence = useContinuousPresence({
    taskOutput: statusResult?.output,
    loading: timeline.isStreaming || loading,
  });

  const realWorldExecution = useRealWorldExecution({
    lastCommand: messages.filter((message) => message.role === "user").at(-1)?.text,
    taskOutput: statusResult?.output,
    loading: timeline.isStreaming || loading,
    taskError: taskError ?? undefined,
  });

  const speechConnection = useSpeechConnection();
  const voiceUsesRealStt =
    voiceSettings.useRealMicrophone && speechConnection.ready;

  const lastUserQuery = useMemo(
    () => messages.filter((message) => message.role === "user").at(-1)?.text,
    [messages],
  );

  const pipelineTelemetry = useMemo(
    () =>
      buildPipelineTelemetryView({
        lastUserQuery,
        loading,
        isStreaming: timeline.isStreaming,
        agentStatus: agentStatus.status,
      }),
    [agentStatus.status, lastUserQuery, loading, timeline.isStreaming],
  );

  const commandMarquee =
    loading || timeline.isStreaming
      ? agentStatus.status.displayMessage
      : undefined;

  const isInputProcessing =
    loading ||
    timeline.isStreaming ||
    voiceSession.sessionState === "listening" ||
    voiceSession.sessionState === "thinking" ||
    voiceSession.sessionState === "executing";

  const isJarvisResponding =
    loading ||
    timeline.isStreaming ||
    voiceSession.isSpeaking ||
    voiceSession.streamingResponse.length > 0;

  const voiceNative = voiceSettings.voiceNativeUi;
  const wakeWordMode =
    voiceSettings.listeningMode === "wake-word" && voiceSettings.wakeWordEnabled;
  const voiceMicBusy =
    voiceSession.sessionState === "thinking" ||
    voiceSession.sessionState === "executing";
  const voiceMicDisabled =
    voiceSession.micBlocked ||
    voiceMicBusy ||
    loading ||
    (voiceSession.isRequestingMic && !wakeWordMode);

  const voiceComposerActions = useMemo(
    () => (
      <div className="chat-voice-actions" data-testid="chat-voice-actions">
        <VoiceButton
          status={voice.status}
          onPress={voice.toggleListening}
          onPushToTalkDown={voiceSession.pushToTalkDown}
          onPushToTalkUp={voiceSession.pushToTalkUp}
          pushToTalk={voiceSettings.listeningMode === "push-to-talk"}
          disabled={voiceMicDisabled}
          useRealMicrophone={voiceUsesRealStt}
        />
        {speechConnection.loading ? null : (
          <span
            className={`voice-mic-status ${voiceUsesRealStt ? "voice-mic-status--live" : "voice-mic-status--stub"}`}
            title={
              wakeWordMode
                ? `Say "${voiceSettings.wakePhrase}" to wake Jarvis`
                : speechConnection.sttEngine
            }
          >
            {wakeWordMode && voiceUsesRealStt
              ? `Say ${voiceSettings.wakePhrase}`
              : voiceUsesRealStt
                ? "Live"
                : "Stub"}
          </span>
        )}
        {!voiceNative ? (
          <VoiceStatusIndicator status={voice.status} error={voice.error} />
        ) : null}
      </div>
    ),
    [
      loading,
      speechConnection.loading,
      speechConnection.sttEngine,
      voice.error,
      voice.status,
      voice.toggleListening,
      voiceNative,
      voiceMicDisabled,
      voiceSettings.listeningMode,
      voiceSettings.wakePhrase,
      voiceSettings.wakeWordEnabled,
      voiceUsesRealStt,
      wakeWordMode,
      voiceSession.pushToTalkDown,
      voiceSession.pushToTalkUp,
    ],
  );

  const showVoiceOverlay =
    voiceNative &&
    (voiceSession.isActive ||
      voiceSession.isSpeaking ||
      voiceSession.partialTranscript.length > 0 ||
      voiceSession.streamingResponse.length > 0);

  return (
    <div
      className={`jarvis-command-center jarvis-command-center--elegant jarvis-command-center--scifi cc-os-shell${voiceNative ? " jarvis-command-center--voice-native" : ""}`}
      data-testid="jarvis-command-center"
    >
      <WorkspaceSidebar
        sessions={workspace.sessions}
        activeSessionId={activeSession.sessionId}
        onSelect={workspace.selectWorkspaceSession}
        onCreate={workspace.createWorkspaceSession}
        onRestore={workspace.restoreWorkspaceSession}
      />

      <div className="command-center-main cc-glass-panel cc-hud-frame">
        <header
          className={`command-center-header cc-header${voiceNative ? " command-center-header--voice-native" : ""}`}
        >
          <div
            className="cc-workspace-token"
            data-testid="active-workspace-token"
            title={activeSession.conversationId}
          >
            <span className="cc-workspace-token__pulse" aria-hidden />
            <span className="cc-workspace-token__label">{activeSession.conversationId}</span>
          </div>
          <JarvisHudStrip
            speech={speechConnection}
            voiceLive={voiceUsesRealStt}
            sessionState={voiceSession.sessionState}
            sttLatencyMs={voiceSession.sttLatencyMs}
            transcriptConfidence={voiceSession.transcriptConfidence}
          />
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
              confidence={voiceSession.transcriptConfidence}
            />
          )}
          <VoiceInterruptController
            visible={voiceSession.isSpeaking}
            onInterrupt={voiceSession.interruptSpeaking}
          />
        </header>

        <div
          className={`command-center-body cc-body-grid${voiceNative ? " command-center-body--voice-native" : ""}`}
        >
          <div
            className={`command-center-transcript cc-transcript-panel cc-glass cc-hud-frame${
              isInputProcessing ? " cc-transcript-panel--processing" : ""
            }`}
          >
            {voiceNative ? (
              <PipelineTelemetryPanel
                activeNode={pipelineTelemetry.activeNode}
                routingPath={pipelineTelemetry.routingPath}
                openClawCluster={pipelineTelemetry.openClawCluster}
                toolsets={pipelineTelemetry.toolsets}
                loading={loading || timeline.isStreaming}
              />
            ) : null}
            {showVoiceOverlay ? (
              <StreamingVoiceOverlay
                visible
                streamingText={voiceSession.streamingResponse}
                partialTranscript={voiceSession.partialTranscript}
                confidence={voiceSession.transcriptConfidence}
                latencyMs={voiceSession.sttLatencyMs}
              />
            ) : null}
            <ReconnectIndicator
              visible={reconnectVisible}
              message={reconnectMessage ?? realWorldExecution.statusLabel}
              degraded={
                (statusResult?.output?.stability as { degraded?: boolean } | undefined)
                  ?.degraded
              }
            />
            <ChatPanel
              messages={messages}
              responding={isJarvisResponding}
              processing={isInputProcessing}
            />
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
            <aside className="command-center-rail cc-rail">
              <PipelineTelemetryPanel
                activeNode={pipelineTelemetry.activeNode}
                routingPath={pipelineTelemetry.routingPath}
                openClawCluster={pipelineTelemetry.openClawCluster}
                toolsets={pipelineTelemetry.toolsets}
                loading={loading || timeline.isStreaming}
              />
              <LiveExecutionPanel
                steps={timeline.steps}
                progress={timeline.progress}
                events={timeline.events}
                loading={timeline.isStreaming || loading}
                displayMessage={agentStatus.status.displayMessage}
                error={taskError ?? agentStatus.status.error}
                providerLabel={providerTelemetry?.label}
                latencyMs={providerTelemetry?.latencyMs}
                memoryRecallMessage={memoryRecallView?.message}
                memoryRecallCount={memoryRecallView?.snippets?.length ?? memoryRecallView?.count}
                browserState={executionRuntimeState.executionRuntime?.browserState}
                permission={executionRuntimeState.executionRuntime?.permission}
                onApprovePermission={executionRuntimeState.approvePermission}
                onDenyPermission={executionRuntimeState.denyPermission}
                onCancelExecution={executionRuntimeState.cancelExecution}
                cancelled={executionRuntimeState.cancelled}
                workforce={workforceActivity.workforce}
                workforceVisible={workforceActivity.showWorkforce}
                workforceDisplayLabel={workforceActivity.displayLabel}
                productivity={productivitySession.productivity}
                productivityVisible={productivitySession.showProductivity}
                productivityDisplayLabel={productivitySession.displayLabel}
                continuous={continuousPresence.continuous}
                continuousVisible={continuousPresence.showContinuous}
                continuousDisplayLabel={continuousPresence.displayLabel}
              />
            </aside>
          ) : null}
        </div>

        <FloatingCommandInput
          value={input}
          onChange={setInput}
          onSubmit={() => void handleSubmit()}
          onCancel={dismissThinking}
          loading={loading}
          placeholder={JARVIS_EXECUTION_LABELS.sendPrompt}
          statusMarquee={commandMarquee}
          leadingAction={voiceComposerActions}
          className="cc-hud-frame"
        />
      </div>
    </div>
  );
}
