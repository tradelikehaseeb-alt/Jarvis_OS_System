import type { CreateTaskResponse, TaskStatusResponse } from "@jarvis/types";

export interface TaskPanelProps {
  readonly loading?: boolean;
  readonly create?: CreateTaskResponse | null;
  readonly status?: TaskStatusResponse | null;
  readonly error?: string | null;
}

function formatSkillOutput(
  output: TaskStatusResponse["output"],
): string | null {
  if (!output?.skill) {
    return null;
  }
  try {
    return JSON.stringify(output.skill, null, 2);
  } catch {
    return String(output.skill);
  }
}

/**
 * Displays latest POST /tasks result and GET status output (Phase 18).
 */
export function TaskPanel({ loading, create, status, error }: TaskPanelProps) {
  if (loading) {
    return (
      <section className="task-panel" aria-busy="true">
        <h2>Task</h2>
        <p className="task-panel-empty">
          <span className="spinner" aria-hidden />
          Running task…
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="task-panel">
        <h2>Task</h2>
        <p className="task-panel-empty" style={{ color: "#fca5a5" }}>
          {error}
        </p>
      </section>
    );
  }

  if (!create && !status) {
    return (
      <section className="task-panel">
        <h2>Task</h2>
        <p className="task-panel-empty">No task yet. Send a chat message.</p>
      </section>
    );
  }

  const skillJson = status ? formatSkillOutput(status.output) : null;

  return (
    <section className="task-panel">
      <h2>Task</h2>
      <dl>
        {create ? (
          <>
            <dt>Task ID</dt>
            <dd>{create.taskId}</dd>
            <dt>Create status</dt>
            <dd>
              <span className={`badge ${create.status}`}>{create.status}</span>
            </dd>
          </>
        ) : null}
        {status ? (
          <>
            <dt>Status</dt>
            <dd>
              <span className={`badge ${status.status}`}>{status.status}</span>
              {status.progressPercent != null
                ? ` (${status.progressPercent}%)`
                : null}
            </dd>
            {status.output?.routing ? (
              <>
                <dt>Agent</dt>
                <dd>
                  {String(
                    (status.output.routing as { selectedAgentId?: string })
                      .selectedAgentId ?? "—",
                  )}
                </dd>
              </>
            ) : null}
          </>
        ) : null}
      </dl>
      {skillJson ? (
        <div style={{ marginTop: "0.75rem" }}>
          <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
            Skill output
          </div>
          <pre>{skillJson}</pre>
        </div>
      ) : null}
    </section>
  );
}
