/** Static mock data for non-Chat pages (Phase 18). */

export interface MockTaskRow {
  readonly taskId: string;
  readonly status: string;
  readonly description: string;
}

export const MOCK_TASKS: readonly MockTaskRow[] = [
  {
    taskId: "task-mock-001",
    status: "completed",
    description: "Organize project documentation",
  },
  {
    taskId: "task-mock-002",
    status: "running",
    description: "Prepare weekly plan",
  },
  {
    taskId: "task-mock-003",
    status: "queued",
    description: "Review automation workflow",
  },
];

export interface MockMemoryRow {
  readonly id: string;
  readonly title: string;
  readonly snippet: string;
}

export const MOCK_MEMORY: readonly MockMemoryRow[] = [
  {
    id: "mem-1",
    title: "Architecture notes",
    snippet: "UI → API → Orchestrator → Agents → Skills",
  },
  {
    id: "mem-2",
    title: "Provider registry",
    snippet: "hermes-local, hermes-cloud, openclaw-local, openclaw-remote",
  },
];

export interface MockPluginRow {
  readonly id: string;
  readonly name: string;
  readonly enabled: boolean;
}

export const MOCK_PLUGINS: readonly MockPluginRow[] = [
  { id: "plugin-calendar", name: "Calendar (stub)", enabled: false },
  { id: "plugin-slack", name: "Slack (stub)", enabled: false },
];
