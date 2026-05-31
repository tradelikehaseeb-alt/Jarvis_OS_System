import { useEffect, useState } from "react";

import { loadMemoryFacts, type MockMemoryRow } from "../data/data-loaders";
import { MOCK_MEMORY } from "../data/mock-data";

/** Memory page — live facts API with mock fallback in tests. */
export function MemoryPage() {
  const [rows, setRows] = useState<readonly MockMemoryRow[]>(MOCK_MEMORY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void loadMemoryFacts()
      .then((facts) => {
        if (active) {
          setRows(facts);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load memory");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="page-card">
      <h2>Memory</h2>
      {error ? (
        <p style={{ color: "var(--danger)" }} role="alert">
          {error}
        </p>
      ) : null}
      <ul style={{ listStyle: "none", padding: 0, margin: "1rem 0 0" }}>
        {rows.map((row) => (
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
