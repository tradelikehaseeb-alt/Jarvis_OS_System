import type { UserTask } from "@jarvis/types";

/** Conversation turn packed into orchestrator context. */
export interface ConversationContextMessage {
  readonly role: string;
  readonly message: string;
  readonly timestamp: string;
}

/** User profile slice for planner prompts. */
export interface UserProfileContext {
  readonly name: string;
}

/**
 * Orchestrator session context — conversation history + profile for agents.
 */
export interface OrchestratorContext {
  readonly contextRef: string;
  readonly taskId: string;
  readonly userId: string;
  readonly createdAt: string;
  readonly conversationId: string;
  readonly messages: readonly ConversationContextMessage[];
  readonly userProfile: UserProfileContext;
  readonly estimatedTokens: number;
  readonly withinTokenLimit: boolean;
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
