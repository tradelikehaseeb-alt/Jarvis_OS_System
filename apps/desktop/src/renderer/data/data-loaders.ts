import type { MockMemoryRow, MockTaskRow } from "./mock-data";
import { MOCK_MEMORY, MOCK_TASKS } from "./mock-data";

const DEFAULT_API_URL = "http://127.0.0.1:8787";

function isTestEnvironment(): boolean {
  if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
    return true;
  }
  if (typeof import.meta !== "undefined") {
    const env = import.meta as ImportMeta & {
      env?: { MODE?: string; NODE_ENV?: string };
    };
    return env.env?.MODE === "test" || env.env?.NODE_ENV === "test";
  }
  return false;
}

async function resolveApiBaseUrl(): Promise<string> {
  if (typeof window !== "undefined" && window.jarvis?.getApiUrl) {
    return window.jarvis.getApiUrl();
  }
  return (
    (typeof process !== "undefined" && process.env.JARVIS_API_URL) ||
    DEFAULT_API_URL
  );
}

async function fetchJson<T>(path: string): Promise<T> {
  const base = await resolveApiBaseUrl();
  const response = await fetch(`${base.replace(/\/$/, "")}${path}`);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }
  return (await response.json()) as T;
}

export interface DashboardData {
  readonly status: string;
  readonly memoryStatus: string;
  readonly factsCount: number;
  readonly checkedAt: string;
}

export interface UserProfileFact {
  readonly key: string;
  readonly value: string;
}

export interface UserProfile {
  readonly userId: string;
  readonly facts: readonly UserProfileFact[];
}

export interface MemoryConversationRow {
  readonly id: string;
  readonly role: string;
  readonly content: string;
  readonly timestamp: string;
  readonly taskId?: string;
}

export interface MemorySearchHit {
  readonly record: {
    readonly id: string;
    readonly content: string;
    readonly createdAt: string;
  };
  readonly score: number;
}

/**
 * Dashboard snapshot — mock in test, live API in production.
 */
export async function loadDashboardData(): Promise<DashboardData> {
  if (isTestEnvironment()) {
    return {
      status: "ok",
      memoryStatus: "ok",
      factsCount: MOCK_MEMORY.length,
      checkedAt: new Date().toISOString(),
    };
  }
  return fetchJson<DashboardData>("/api/dashboard");
}

/**
 * Memory facts from embedded API.
 */
export async function loadMemoryFacts(): Promise<readonly MockMemoryRow[]> {
  if (isTestEnvironment()) {
    return MOCK_MEMORY;
  }
  const payload = await fetchJson<{
    facts?: Array<{ key: string; value: string }>;
  }>("/memory/facts?userId=default");
  const facts = payload.facts ?? [];
  return facts.map((fact, index) => ({
    id: `fact-${index}`,
    title: fact.key,
    snippet: fact.value,
  }));
}

export async function loadRecentConversations(): Promise<readonly MemoryConversationRow[]> {
  if (isTestEnvironment()) {
    return [];
  }
  const payload = await fetchJson<{
    conversations?: MemoryConversationRow[];
  }>("/memory/recent?userId=default&limit=10");
  return payload.conversations ?? [];
}

export async function searchMemories(query: string): Promise<readonly MemorySearchHit[]> {
  if (isTestEnvironment()) {
    const lower = query.toLowerCase();
    return MOCK_MEMORY.filter(
      (row) =>
        row.title.toLowerCase().includes(lower) ||
        row.snippet.toLowerCase().includes(lower),
    ).map((row, index) => ({
      record: {
        id: row.id,
        content: `${row.title}: ${row.snippet}`,
        createdAt: new Date().toISOString(),
      },
      score: 1 - index * 0.05,
    }));
  }
  const encoded = encodeURIComponent(query);
  const payload = await fetchJson<{ results?: MemorySearchHit[] }>(
    `/memory/search?userId=default&q=${encoded}&limit=10`,
  );
  return payload.results ?? [];
}

/**
 * Recent tasks — mock in test, API in production.
 */
export async function loadRecentTasks(): Promise<readonly MockTaskRow[]> {
  if (isTestEnvironment()) {
    return MOCK_TASKS;
  }
  const payload = await fetchJson<{
    tasks?: Array<{
      taskId: string;
      status: string;
      description?: string;
    }>;
  }>("/tasks/recent?limit=10");
  return (payload.tasks ?? []).map((task) => ({
    taskId: task.taskId,
    status: task.status,
    description: task.description ?? "Task",
  }));
}

/**
 * User profile from memory user_facts.
 */
export async function loadUserProfile(): Promise<UserProfile> {
  if (isTestEnvironment()) {
    return {
      userId: "default",
      facts: MOCK_MEMORY.map((row) => ({
        key: row.title,
        value: row.snippet,
      })),
    };
  }
  const payload = await fetchJson<{
    facts?: Array<{ key: string; value: string }>;
  }>("/memory/facts?userId=default");
  return {
    userId: "default",
    facts: (payload.facts ?? []).map((fact) => ({
      key: fact.key,
      value: fact.value,
    })),
  };
}
