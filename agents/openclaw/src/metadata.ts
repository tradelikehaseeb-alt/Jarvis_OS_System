import type { AgentMetadata } from "@jarvis/agents-shared";

/** OpenClaw gateway agent id — execution behind orchestrator only. */
export const OPENCLAW_AGENT_ID = "openclaw-gateway" as const;

/**
 * Static metadata for OpenClaw gateway (Phase 10 stub).
 * Sandbox and permission checks required before real execution (Phase 11+).
 */
export const OPENCLAW_METADATA: AgentMetadata = {
  agentId: OPENCLAW_AGENT_ID,
  displayName: "OpenClaw Gateway",
  version: "0.0.0-phase10",
  executionCapable: true,
  capabilities: [
    {
      id: "openclaw-execution",
      kind: "execution",
      description: "Run approved execution steps (stub)",
    },
    {
      id: "openclaw-browser",
      kind: "browser-automation",
      description: "Browser automation via sandboxed gateway (stub)",
    },
    {
      id: "openclaw-desktop",
      kind: "desktop-automation",
      description: "Desktop automation via sandboxed gateway (stub)",
    },
  ],
};
