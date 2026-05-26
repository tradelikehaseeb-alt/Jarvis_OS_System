import { MOCK_PLUGINS } from "../data/mock-data";

/** Plugins page — static registry mock (Phase 18). */
export function PluginsPage() {
  return (
    <div className="page-card">
      <h2>Plugins (mock)</h2>
      <table className="mock-table">
        <thead>
          <tr>
            <th>Plugin</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_PLUGINS.map((row) => (
            <tr key={row.id}>
              <td>{row.name}</td>
              <td>{row.enabled ? "Enabled" : "Disabled"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
