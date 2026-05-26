import { MOCK_MEMORY } from "../data/mock-data";

/** Memory page — static mock entries (Phase 18). */
export function MemoryPage() {
  return (
    <div className="page-card">
      <h2>Memory (mock)</h2>
      <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
        Hermes will use Memory Service APIs when persistence is implemented.
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: "1rem 0 0" }}>
        {MOCK_MEMORY.map((row) => (
          <li
            key={row.id}
            style={{
              padding: "0.75rem 0",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <strong>{row.title}</strong>
            <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
              {row.snippet}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
