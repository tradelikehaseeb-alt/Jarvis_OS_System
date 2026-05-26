import type { AgentContext } from "./agent-context";
import type { AgentMetadata } from "./agent-metadata";
import type { AgentResult } from "./agent-result";
import type { AgentTask } from "./agent-task";

/**
 * Base contract every Jarvis agent must implement (Hermes, OpenClaw gateway, etc.).
 *
 * No default behavior — implementations live in agent packages (Phase 9+).
 */
export interface BaseAgent {
  readonly metadata: AgentMetadata;

  /**
   * Process one orchestrator-assigned task.
   * Must not bypass memory or execution sandbox rules.
   */
  execute(task: AgentTask, context: AgentContext): Promise<AgentResult>;
}

/**
 * Optional abstract base for class-based agents — enforces structure only.
 */
export abstract class AbstractBaseAgent implements BaseAgent {
  abstract readonly metadata: AgentMetadata;

  abstract execute(task: AgentTask, context: AgentContext): Promise<AgentResult>;
}
