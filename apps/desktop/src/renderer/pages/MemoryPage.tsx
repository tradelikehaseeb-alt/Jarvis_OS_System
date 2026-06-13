import { useCallback, useEffect, useMemo, useState } from "react";

import {
  loadMemoryFacts,
  loadRecentConversations,
  loadUserProfile,
  searchMemories,
  type MemoryConversationRow,
  type MockMemoryRow,
} from "../data/data-loaders";

/** Memory page — profile cards, conversations, and search. */
export function MemoryPage() {
  const [facts, setFacts] = useState<readonly MockMemoryRow[]>([]);
  const [conversations, setConversations] = useState<readonly MemoryConversationRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    readonly { id: string; content: string; score: number }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profile, recent] = await Promise.all([
        loadUserProfile(),
        loadRecentConversations(),
      ]);
      setFacts(
        profile.facts.map((fact, index) => ({
          id: `fact-${index}`,
          title: fact.key,
          snippet: fact.value,
        })),
      );
      setConversations(recent);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load memory";
      setError(message);
      try {
        const fallback = await loadMemoryFacts();
        setFacts(fallback);
      } catch {
        /* keep prior error */
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const profileCard = useMemo(() => {
    const byKey = new Map(facts.map((row) => [row.title, row.snippet]));
    return {
      name: byKey.get("name") ?? "Haseeb Rasheed",
      location: byKey.get("location") ?? "Karachi, Pakistan",
      businesses: byKey.get("businesses") ?? "GreenPlus Herbs, Ruby Travel",
    };
  }, [facts]);

  const runSearch = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      return;
    }
    try {
      const hits = await searchMemories(query);
      setSearchResults(
        hits.map((hit) => ({
          id: hit.record.id,
          content: hit.record.content,
          score: hit.score,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    }
  }, [searchQuery]);

  return (
    <div className="page-card memory-page">
      <header className="memory-page-header">
        <h2>Memory</h2>
        <p className="memory-page-lead">In-memory profile and conversation recall (local backend).</p>
      </header>

      {loading ? <p role="status">Loading memory…</p> : null}
      {error ? (
        <p className="memory-page-error" role="alert">
          {error}
        </p>
      ) : null}

      <section className="memory-profile-card" aria-label="User profile">
        <h3>Profile</h3>
        <div className="memory-fact-grid">
          <article className="memory-fact-card">
            <span className="memory-fact-label">Name</span>
            <strong>{profileCard.name}</strong>
          </article>
          <article className="memory-fact-card">
            <span className="memory-fact-label">Location</span>
            <strong>{profileCard.location}</strong>
          </article>
          <article className="memory-fact-card">
            <span className="memory-fact-label">Businesses</span>
            <strong>{profileCard.businesses}</strong>
          </article>
        </div>
      </section>

      <section className="memory-search-section" aria-label="Memory search">
        <h3>Search memories</h3>
        <div className="memory-search-row">
          <input
            type="search"
            className="memory-search-input"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search facts and conversations…"
            aria-label="Search memories"
          />
          <button type="button" className="btn btn-secondary" onClick={() => void runSearch()}>
            Search
          </button>
        </div>
        {searchResults.length > 0 ? (
          <ul className="memory-search-results">
            {searchResults.map((hit) => (
              <li key={hit.id}>
                <span className="memory-search-score">{hit.score.toFixed(2)}</span>
                {hit.content}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="memory-facts-section" aria-label="Stored facts">
        <h3>Stored facts</h3>
        <div className="memory-fact-grid">
          {facts.map((row) => (
            <article key={row.id} className="memory-fact-card">
              <span className="memory-fact-label">{row.title}</span>
              <p>{row.snippet}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="memory-conversations-section" aria-label="Recent conversations">
        <h3>Recent conversations</h3>
        {conversations.length === 0 ? (
          <p className="memory-empty">No conversations stored yet.</p>
        ) : (
          <ul className="memory-conversation-list">
            {conversations.map((row) => (
              <li key={row.id} className="memory-conversation-item">
                <span className={`memory-role memory-role--${row.role}`}>{row.role}</span>
                <p>{row.content}</p>
                <time dateTime={row.timestamp}>{new Date(row.timestamp).toLocaleString()}</time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
