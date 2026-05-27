import type {
  CreateWorkspaceSessionInput,
  WorkspaceSession,
} from "./workspace-session";

/**
 * Conversation workspace runtime contract (Phase 76).
 */
export interface ConversationWorkspaceRuntime {
  createWorkspaceSession(input: CreateWorkspaceSessionInput): WorkspaceSession;
  getWorkspaceSession(sessionId: string): WorkspaceSession | undefined;
  restoreWorkspaceSession(sessionId: string): WorkspaceSession | undefined;
  archiveWorkspaceSession(sessionId: string): WorkspaceSession | undefined;
  linkTimeline(sessionId: string, timelineId: string): void;
}
