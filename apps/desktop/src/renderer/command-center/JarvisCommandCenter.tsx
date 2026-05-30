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
import { MemoryContextIndicator } from "../memory/MemoryContextIndicator";
import { ReconnectIndicator } from "../hardening/ReconnectIndicator";
import {
  BrowserStateIndicator,
  ExecutionPermissionPrompt,
  useExecutionRuntime,
} from "../execution";
import { DemoExecutionFlow, useDemoInteraction } from "../demo";
import { WorkforceActivityPanel, useWorkforceActivity } from "../workforce";
import { ProductivityDashboard, useProductivitySession } from "../productivity";
import { ContinuousPresencePanel, useContinuousPresence } from "../continuous";
import { RealWorldExecutionIndicator, useRealWorldExecution, ExecutionRealityBar, useExecutionReality } from "../real-world";

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
    memoryRecallView,
    statusResult,
  } = conversation;

  const reconnectVisible =
    Boolean(taskError) ||
    providerTelemetry?.label?.includes("offline") ||
    (statusResult?.output?.stability as { degraded?: boolean } | undefined)?.degraded ===
      true;
  const reconnectMessage =
    (statusResult?.output?.stability as { message?: string } | undefined)?.message ??
    (taskError ? "Reconnecting…" : undefined);

  const executionRuntimeState = useExecutionRuntime({
    taskOutput: statusResult?.output,
  });

  const lastUserCommand = messages.filter((message) => message.role === "user").at(-1)?.text;
  const demoInteraction = useDemoInteraction({
    command: lastUserCommand,
    loading: timeline.isStreaming || loading,
    progress: timeline.progress,
    displayMessage: agentStatus.status.displayMessage,
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
    lastCommand: lastUserCommand,
    taskOutput: statusResult?.output,
    loading: timeline.isStreaming || loading,
    taskError: taskError ?? undefined,
  });

  const executionReality = useExecutionReality({
    taskOutput: statusResult?.output,
    voiceSettings,
    sttLatencyMs: voiceSession.sttLatencyMs,
    sttStub: !voiceSettings.useRealMicrophone,
    sttProviderId: voiceSettings.sttProviderId,
  });

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
          <ExecutionRealityBar
            llm={executionReality.llm}
            browser={executionReality.browser}
            voice={executionReality.voice}
            summaryLabel={executionReality.summaryLabel}
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
            <ReconnectIndicator
              visible={reconnectVisible}
              message={reconnectMessage ?? realWorldExecution.statusLabel}
              degraded={
                (statusResult?.output?.stability as { degraded?: boolean } | undefined)
                  ?.degraded
              }
            />
            <RealWorldExecutionIndicator
              visible={realWorldExecution.showIndicator}
              statusLabel={realWorldExecution.statusLabel}
              loading={timeline.isStreaming || loading}
              providerOnline={realWorldExecution.providerOnline}
              degraded={
                (statusResult?.output?.stability as { degraded?: boolean } | undefined)
                  ?.degraded
              }
            />
            <DemoExecutionFlow
              visible={demoInteraction.showDemoFlow}
              phase={demoInteraction.demoPhase}
              message={demoInteraction.demoMessage}
              progress={timeline.progress}
            />
            <WorkforceActivityPanel
              visible={workforceActivity.showWorkforce && voiceNative}
              workforce={workforceActivity.workforce}
              loading={timeline.isStreaming || loading}
              displayLabel={workforceActivity.displayLabel}
            />
            <ProductivityDashboard
              visible={productivitySession.showProductivity && voiceNative}
              productivity={productivitySession.productivity}
              loading={timeline.isStreaming || loading}
              displayLabel={productivitySession.displayLabel}
            />
            <ContinuousPresencePanel
              visible={continuousPresence.showContinuous && voiceNative}
              continuous={continuousPresence.continuous}
              loading={timeline.isStreaming || loading}
              displayLabel={continuousPresence.displayLabel}
            />
            <MemoryContextIndicator
              visible={Boolean(memoryRecallView?.message)}
              message={memoryRecallView?.message}
              snippetCount={memoryRecallView?.snippets?.length ?? memoryRecallView?.count}
            />
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
          loading={loading}
          placeholder={JARVIS_EXECUTION_LABELS.sendPrompt}
          leadingAction={voiceComposerActions}
        />
      </div>
    </div>
  );
}
