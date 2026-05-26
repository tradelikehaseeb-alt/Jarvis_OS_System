import type { AgentMetadata } from "@jarvis/agents-shared";

/** Hermes agent id — used by orchestrator and registry. */
export const HERMES_AGENT_ID = "hermes" as const;

/**
 * Static metadata for Hermes (Phase 10 stub).
 * Memory access must use Jarvis Memory Service APIs in Phase 11+.
 */
export const HERMES_METADATA: AgentMetadata = {
  agentId: HERMES_AGENT_ID,
  displayName: "Hermes",
  version: "0.0.0-phase10",
  executionCapable: false,
  capabilities: [
    {
      id: "hermes-planning",
      kind: "planning",
      description: "Task and workflow planning (stub)",
    },
    {
      id: "hermes-reasoning",
      kind: "reasoning",
      description: "Reasoning over user intent (stub)",
    },
    {
      id: "hermes-memory-access",
      kind: "memory-access",
      description: "Read/write via Memory Service APIs only (stub)",
    },
    {
      id: "hermes-decomposition",
      kind: "task-decomposition",
      description: "Break work into workflow steps (stub)",
    },
  ],
};
