import type { UserTask } from "@jarvis/types";

/**
 * Opaque orchestrator session context (memory service refs in Phase 3+).
 */
export interface OrchestratorContext {
  readonly contextRef: string;
  readonly taskId: string;
  readonly userId: string;
  readonly createdAt: string;
}

/**
 * Input to create or bind context for a task.
 */
export interface ContextManagerCreateInput {
  readonly task: UserTask;
}

/**
 * Manages orchestrator-scoped context; Hermes reads memory via APIs only (Phase 3+).
 */
export interface ContextManager {
  readonly componentId: "context-manager";
  create(input: ContextManagerCreateInput): Promise<OrchestratorContext>;
  get(contextRef: string): Promise<OrchestratorContext | undefined>;
}
