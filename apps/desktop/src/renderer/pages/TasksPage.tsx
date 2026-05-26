import { MOCK_TASKS } from "../data/mock-data";

/** Tasks page — static mock list (Phase 18). */
export function TasksPage() {
  return (
    <div className="page-card">
      <h2>Recent tasks (mock)</h2>
      <table className="mock-table">
        <thead>
          <tr>
            <th>Task ID</th>
            <th>Status</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_TASKS.map((row) => (
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
