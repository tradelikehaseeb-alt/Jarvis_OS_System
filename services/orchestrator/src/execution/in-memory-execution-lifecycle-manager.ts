import type { ExecutionActivity } from "./execution-activity";
import type { ExecutionEvent, ExecutionEventKind } from "./execution-event";
import type { ExecutionSession, StartExecutionSessionInput } from "./execution-session";
import type { ExecutionState } from "./execution-state";
import type {
  EmitExecutionActivityInput,
  ExecutionActivityListener,
  ExecutionEventListener,
  ExecutionLifecycleManager,
} from "./execution-lifecycle-manager";

let sequence = 0;

function nextId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${Date.now()}-${sequence}`;
}

function terminalState(state: ExecutionState): boolean {
  return state === "completed" || state === "failed" || state === "cancelled";
}

function eventKindForTerminal(state: ExecutionState): ExecutionEventKind {
  switch (state) {
    case "completed":
      return "session_completed";
    case "failed":
      return "session_failed";
    case "cancelled":
      return "session_cancelled";
    default:
      return "state_changed";
  }
}

/**
 * In-memory execution lifecycle manager with internal event streaming (Phase 45).
 */
export class InMemoryExecutionLifecycleManager implements ExecutionLifecycleManager {
  private readonly sessions = new Map<string, ExecutionSession>();
  private readonly taskToSession = new Map<string, string>();
  private readonly eventListeners = new Set<ExecutionEventListener>();
  private readonly activityListeners = new Set<ExecutionActivityListener>();

  startSession(input: StartExecutionSessionInput): ExecutionSession {
    const sessionId = `exec-session-${input.taskId}`;
    const now = new Date().toISOString();
    let session: ExecutionSession = {
      sessionId,
      taskId: input.taskId,
      requestId: input.requestId,
      userId: input.userId,
      state: "queued",
      createdAt: now,
      updatedAt: now,
      activities: [],
      events: [],
    };

    session = this.appendEvent(session, {
      eventId: nextId("evt"),
      sessionId,
      taskId: input.taskId,
      kind: "session_started",
      state: "queued",
      timestamp: now,
      message: "Execution session queued",
    });

    this.sessions.set(sessionId, session);
    this.taskToSession.set(input.taskId, sessionId);
    return session;
  }

  getSession(sessionId: string): ExecutionSession | undefined {
    return this.sessions.get(sessionId);
  }

  getSessionByTaskId(taskId: string): ExecutionSession | undefined {
    const sessionId = this.taskToSession.get(taskId);
    return sessionId ? this.sessions.get(sessionId) : undefined;
  }

  transition(
    sessionId: string,
    state: ExecutionState,
    message?: string,
  ): ExecutionSession {
    const current = this.requireSession(sessionId);
    const now = new Date().toISOString();
    let session: ExecutionSession = {
      ...current,
      state,
      updatedAt: now,
    };

    const kind = terminalState(state)
      ? eventKindForTerminal(state)
      : "state_changed";

    session = this.appendEvent(session, {
      eventId: nextId("evt"),
      sessionId,
      taskId: current.taskId,
      kind,
      state,
      timestamp: now,
      message,
    });

    this.sessions.set(sessionId, session);
    return session;
  }

  emitActivity(
    sessionId: string,
    input: EmitExecutionActivityInput,
  ): ExecutionActivity {
    const current = this.requireSession(sessionId);
    const activity: ExecutionActivity = {
      activityId: nextId("act"),
      sessionId,
      taskId: input.taskId,
      source: input.source,
      kind: input.kind,
      timestamp: new Date().toISOString(),
      summary: input.summary,
      payload: input.payload,
    };

    let session: ExecutionSession = {
      ...current,
      updatedAt: activity.timestamp,
      activities: [...current.activities, activity],
    };

    session = this.appendEvent(session, {
      eventId: nextId("evt"),
      sessionId,
      taskId: input.taskId,
      kind: "activity",
      state: current.state,
      timestamp: activity.timestamp,
      message: activity.summary,
      activity,
    });

    this.sessions.set(sessionId, session);
    this.notifyActivity(activity);
    return activity;
  }

  subscribe(listener: ExecutionEventListener): () => void {
    this.eventListeners.add(listener);
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  subscribeActivities(listener: ExecutionActivityListener): () => void {
    this.activityListeners.add(listener);
    return () => {
      this.activityListeners.delete(listener);
    };
  }

  private requireSession(sessionId: string): ExecutionSession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Execution session ${sessionId} not found`);
    }
    return session;
  }

  private appendEvent(
    session: ExecutionSession,
    event: ExecutionEvent,
  ): ExecutionSession {
    const next = {
      ...session,
      events: [...session.events, event],
    };
    this.notifyEvent(event);
    return next;
  }

  private notifyEvent(event: ExecutionEvent): void {
    for (const listener of this.eventListeners) {
      listener(event);
    }
  }

  private notifyActivity(activity: ExecutionActivity): void {
    for (const listener of this.activityListeners) {
      listener(activity);
    }
  }
}
