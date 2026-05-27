import { ExecutionTimeline } from "../timeline/ExecutionTimeline";

import type { WorkspaceSessionView } from "./workspace-types";

export interface WorkspaceSessionPanelProps {
  readonly session: WorkspaceSessionView;
}

/**
 * Active workspace session details — history, timeline, memories, runtime (Phase 76).
 */
export function WorkspaceSessionPanel({ session }: WorkspaceSessionPanelProps) {
  return (
    <section
      className="workspace-session-panel"
      aria-label="Workspace session"
      data-testid="workspace-session-panel"
      data-status={session.status}
    >
      <header className="workspace-session-panel__header">
        <h3>Active Session</h3>
        <span data-testid="workspace-session-id">{session.conversationId}</span>
      </header>

      <div
        className="workspace-session-panel__runtime"
        data-testid="workspace-runtime-state"
        data-phase={session.runtimeState.phase}
        data-healthy={session.runtimeState.healthy ? "true" : "false"}
      >
        <strong>Runtime</strong>
        <span>{session.runtimeState.phase}</span>
        {session.runtimeState.message ? <span>{session.runtimeState.message}</span> : null}
      </div>

      <section data-testid="workspace-history">
        <h4>Conversation History</h4>
        {session.historyTurns.length === 0 ? (
          <p>No conversation turns yet.</p>
        ) : (
          <ul>
            {session.historyTurns.slice(-5).map((turn, index) => (
              <li key={`${turn.role}-${index}`}>
                <strong>{turn.role}</strong>: {turn.message}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section data-testid="workspace-timeline">
        <h4>Task Timeline</h4>
        <ExecutionTimeline steps={session.timelineSteps} />
      </section>

      <section data-testid="workspace-memories">
        <h4>Related Memories</h4>
        {session.relatedMemories.length === 0 ? (
          <p>No related memories yet.</p>
        ) : (
          <ul>
            {session.relatedMemories.map((memory) => (
              <li key={memory.id} data-source={memory.source}>
                {memory.content}
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
