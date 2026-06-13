import type { WorkspaceSessionView } from "./workspace-types";

export interface WorkspaceSidebarProps {
  readonly sessions: readonly WorkspaceSessionView[];
  readonly activeSessionId: string;
  readonly onSelect: (sessionId: string) => void;
  readonly onCreate: () => void;
  readonly onRestore: (sessionId: string) => void;
}

/**
 * Workspace session sidebar (Phase 76).
 */
export function WorkspaceSidebar({
  sessions,
  activeSessionId,
  onSelect,
  onCreate,
  onRestore,
}: WorkspaceSidebarProps) {
  return (
    <aside
      className="workspace-sidebar cc-glass"
      aria-label="Conversation workspace sessions"
      data-testid="workspace-sidebar"
    >
      <header className="workspace-sidebar__header">
        <h2>Sessions</h2>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCreate}
          data-testid="workspace-create-session"
        >
          New
        </button>
      </header>

      <ul className="workspace-sidebar__list" data-testid="workspace-sidebar-list">
        {sessions.map((session) => (
          <li key={session.sessionId}>
            <button
              type="button"
              className={`workspace-sidebar__item cc-session-pill${
                session.sessionId === activeSessionId
                  ? " workspace-sidebar__item--active cc-session-pill--active"
                  : ""
              }`}
              data-testid={`workspace-session-${session.sessionId}`}
              data-status={session.status}
              onClick={() => onSelect(session.sessionId)}
            >
              <strong className="cc-session-pill__id">{session.conversationId}</strong>
              {session.sessionId === activeSessionId ? (
                <span className="cc-session-pill__live" aria-hidden />
              ) : null}
              <span className="cc-session-pill__status">{session.status}</span>
            </button>
            {session.status === "archived" ? (
              <button
                type="button"
                className="btn btn-secondary workspace-sidebar__restore"
                onClick={() => onRestore(session.sessionId)}
                data-testid={`workspace-restore-${session.sessionId}`}
              >
                Restore
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </aside>
  );
}
