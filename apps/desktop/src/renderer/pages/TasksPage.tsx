import { useEffect, useState } from "react";

import { loadRecentTasks } from "../data/data-loaders";
import type { MockTaskRow } from "../data/mock-data";
import { MOCK_TASKS } from "../data/mock-data";

/** Tasks page — live API with mock fallback in tests. */
export function TasksPage() {
  const [tasks, setTasks] = useState<readonly MockTaskRow[]>(MOCK_TASKS);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void loadRecentTasks()
      .then((rows) => {
        if (active) {
          setTasks(rows);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load tasks");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="page-card">
      <h2>Recent tasks</h2>
      {error ? (
        <p style={{ color: "var(--danger)" }} role="alert">
          {error}
        </p>
      ) : null}
      <table className="mock-table">
        <thead>
          <tr>
            <th>Task ID</th>
            <th>Status</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((row) => (
            <tr key={row.taskId}>
              <td>{row.taskId}</td>
              <td>
                <span className={`badge ${row.status}`}>{row.status}</span>
              </td>
              <td>{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
